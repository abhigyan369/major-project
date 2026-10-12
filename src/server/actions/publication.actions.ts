"use server";

import db from "@/lib/db";
import {
  requireAuth,
  requireUser,
  requireAdmin,
  requirePublicationOwner,
  assertPublicationEditable,
} from "@/lib/auth-helpers";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import {
  PublicationStatus,
  ApprovalAction,
  NotificationType,
  AuditAction,
  PublicationType,
  ScopusQuartile,
  StudentInvolvement,
} from "@prisma/client";
import { revalidatePath as nextRevalidatePath } from "next/cache";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch {
    // Suppress static generation store error when executing in CLI test scripts
  }
}

import { DocumentType } from "@prisma/client";
import { getStorageProvider, validateAndPrepareDocumentUpload } from "@/lib/storage";
import { sendPublicationSubmittedNotifications } from "@/server/actions/notification.actions";
import { createPublicationSchema } from "@/validators/publication";

export interface CreatePublicationInput {
  title: string;
  publicationType?: PublicationType;
  rawAuthors?: string;
  correspondingAuthorName?: string;
  departmentId: string;
  researchAreaId?: string;

  journalId?: string;
  venueName?: string;
  publisher?: string;
  issn?: string;
  volume?: string;
  issue?: string;
  pages?: string;

  isScopus?: boolean;
  isWebOfScience?: boolean;
  quartile?: ScopusQuartile;
  impactFactor?: number | null;

  submissionDate?: string | null;
  acceptanceDate?: string | null;
  publicationDate?: string | null;

  doi?: string;
  publicationUrl?: string;

  fundingAgency?: string;
  grantTitle?: string;
  grantAmountLakhs?: number | null;
  studentInvolvement?: StudentInvolvement;
  hasCollaboration?: boolean;
  externalCollaborators?: string;

  actionType?: "draft" | "submit";
}

export async function createPublicationAction(input: CreatePublicationInput) {
  const user = await requireUser();
  const validated = createPublicationSchema.parse(input);

  const isSubmit = validated.actionType === "submit";
  const initialStatus = isSubmit ? PublicationStatus.SUBMITTED : PublicationStatus.DRAFT;

  const publication = await db.publication.create({
    data: {
      title: validated.title,
      publicationType: validated.publicationType || PublicationType.JOURNAL_ARTICLE,
      departmentId: validated.departmentId,
      researchAreaId: validated.researchAreaId || undefined,
      correspondingAuthorName: validated.correspondingAuthorName || undefined,

      journalId: input.journalId || undefined,
      venueName: input.venueName || undefined,
      publisher: input.publisher || undefined,
      issn: input.issn || undefined,
      volume: input.volume || undefined,
      issue: input.issue || undefined,
      pages: input.pages || undefined,

      isScopus: input.isScopus ?? false,
      isWebOfScience: input.isWebOfScience ?? false,
      quartile: input.quartile || ScopusQuartile.UNSPECIFIED,
      impactFactor: input.impactFactor !== undefined ? input.impactFactor : undefined,

      submissionDate: input.submissionDate ? new Date(input.submissionDate) : (isSubmit ? new Date() : undefined),
      acceptanceDate: input.acceptanceDate ? new Date(input.acceptanceDate) : undefined,
      publicationDate: input.publicationDate ? new Date(input.publicationDate) : undefined,

      doi: input.doi || undefined,
      publicationUrl: input.publicationUrl || undefined,

      fundingAgency: input.fundingAgency || undefined,
      grantTitle: input.grantTitle || undefined,
      grantAmountLakhs: input.grantAmountLakhs !== undefined ? input.grantAmountLakhs : undefined,
      studentInvolvement: input.studentInvolvement || StudentInvolvement.NONE,
      hasCollaboration: input.hasCollaboration ?? false,
      externalCollaborators: input.externalCollaborators || undefined,

      createdById: user.id,
      status: initialStatus,
      authors: {
        create: [
          {
            userId: user.id,
            authorName: user.name || user.email || "Faculty Author",
            authorEmail: user.email,
            authorOrder: 1,
            isInternal: true,
            isCorresponding: true,
          },
          ...(input.rawAuthors
            ? input.rawAuthors
                .split(",")
                .map((name) => name.trim())
                .filter((name) => name && name !== (user.name || user.email))
                .map((name, idx) => ({
                  authorName: name,
                  authorOrder: idx + 2,
                  isInternal: false,
                }))
            : []),
        ],
      },
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: isSubmit ? AuditAction.PUBLICATION_SUBMIT : AuditAction.PUBLICATION_CREATE,
      entityType: "Publication",
      entityId: publication.id,
      details: { title: publication.title, status: initialStatus },
    },
  });

  if (isSubmit) {
    await sendPublicationSubmittedNotifications(
      publication.id,
      user.id,
      publication.title,
      user.name || user.email
    );
  }

  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication };
}

export async function updatePublicationAction(
  publicationId: string,
  input: Partial<CreatePublicationInput>
) {
  const user = await requireAuth();

  // Enforce ownership check to prevent IDOR
  const existingPub = await requirePublicationOwner(publicationId, user.id);

  // Enforce edit status restriction (must be DRAFT or REVISION_REQUIRED)
  assertPublicationEditable(existingPub);

  const isSubmit = input.actionType === "submit";
  const newStatus = isSubmit
    ? PublicationStatus.SUBMITTED
    : existingPub.status;

  const updated = await db.publication.update({
    where: { id: publicationId },
    data: {
      title: input.title !== undefined ? input.title : existingPub.title,
      publicationType: input.publicationType || existingPub.publicationType,
      departmentId: input.departmentId || existingPub.departmentId,
      researchAreaId: input.researchAreaId !== undefined ? input.researchAreaId : existingPub.researchAreaId,
      correspondingAuthorName: input.correspondingAuthorName !== undefined ? input.correspondingAuthorName : existingPub.correspondingAuthorName,

      journalId: input.journalId !== undefined ? input.journalId : existingPub.journalId,
      venueName: input.venueName !== undefined ? input.venueName : existingPub.venueName,
      publisher: input.publisher !== undefined ? input.publisher : existingPub.publisher,
      issn: input.issn !== undefined ? input.issn : existingPub.issn,
      volume: input.volume !== undefined ? input.volume : existingPub.volume,
      issue: input.issue !== undefined ? input.issue : existingPub.issue,
      pages: input.pages !== undefined ? input.pages : existingPub.pages,

      isScopus: input.isScopus !== undefined ? input.isScopus : existingPub.isScopus,
      isWebOfScience: input.isWebOfScience !== undefined ? input.isWebOfScience : existingPub.isWebOfScience,
      quartile: input.quartile || existingPub.quartile,
      impactFactor: input.impactFactor !== undefined ? input.impactFactor : existingPub.impactFactor,

      submissionDate: input.submissionDate ? new Date(input.submissionDate) : (isSubmit ? new Date() : existingPub.submissionDate),
      acceptanceDate: input.acceptanceDate ? new Date(input.acceptanceDate) : existingPub.acceptanceDate,
      publicationDate: input.publicationDate ? new Date(input.publicationDate) : existingPub.publicationDate,

      doi: input.doi !== undefined ? input.doi : existingPub.doi,
      publicationUrl: input.publicationUrl !== undefined ? input.publicationUrl : existingPub.publicationUrl,

      fundingAgency: input.fundingAgency !== undefined ? input.fundingAgency : existingPub.fundingAgency,
      grantTitle: input.grantTitle !== undefined ? input.grantTitle : existingPub.grantTitle,
      grantAmountLakhs: input.grantAmountLakhs !== undefined ? input.grantAmountLakhs : existingPub.grantAmountLakhs,
      studentInvolvement: input.studentInvolvement || existingPub.studentInvolvement,
      hasCollaboration: input.hasCollaboration !== undefined ? input.hasCollaboration : existingPub.hasCollaboration,
      externalCollaborators: input.externalCollaborators !== undefined ? input.externalCollaborators : existingPub.externalCollaborators,

      status: newStatus,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: isSubmit ? AuditAction.PUBLICATION_SUBMIT : AuditAction.PUBLICATION_UPDATE,
      entityType: "Publication",
      entityId: updated.id,
      details: { title: updated.title, status: newStatus },
    },
  });

  if (isSubmit && existingPub.status !== PublicationStatus.SUBMITTED) {
    await sendPublicationSubmittedNotifications(
      updated.id,
      user.id,
      updated.title,
      user.name || user.email
    );
  }

  revalidatePath(`/user/publications/${publicationId}`);
  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication: updated };
}

export async function uploadPublicationDocumentAction(formData: FormData) {
  const user = await requireAuth();

  const publicationId = formData.get("publicationId") as string;
  const documentTypeInput = formData.get("documentType") as string;
  const file = formData.get("file") as File | null;

  if (!publicationId) {
    throw new ValidationError("Publication ID is required.");
  }
  if (!file || typeof file === "string" || !file.name) {
    throw new ValidationError("Please select a file to upload.");
  }

  const publication = await db.publication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new NotFoundError("Publication");
  }

  const isOwner = publication.createdById === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You are not authorized to upload documents for this publication.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { sanitizedFileName, detectedMimeType, fileSize, storageKey } =
    validateAndPrepareDocumentUpload(fileBuffer, file.name, publicationId);

  const validDocType =
    documentTypeInput && Object.values(DocumentType).includes(documentTypeInput as DocumentType)
      ? (documentTypeInput as DocumentType)
      : DocumentType.MANUSCRIPT;

  const storageProvider = getStorageProvider();
  await storageProvider.uploadFile(fileBuffer, storageKey, detectedMimeType);

  const document = await db.publicationDocument.create({
    data: {
      publicationId,
      fileName: sanitizedFileName,
      fileType: detectedMimeType,
      filePath: storageKey,
      fileSize,
      documentType: validDocType,
      uploadedById: user.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.DOCUMENT_UPLOAD,
      entityType: "PublicationDocument",
      entityId: document.id,
      details: {
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        publicationId,
      },
    },
  });

  revalidatePath(`/user/publications/${publicationId}`);
  revalidatePath(`/admin/publications/${publicationId}`);
  return { success: true, document };
}

export async function addPublicationDocumentAction(
  publicationId: string,
  documentData: {
    fileName: string;
    fileType: string;
    filePath: string;
    documentType?: DocumentType;
  }
) {
  const user = await requireAuth();
  
  const publication = await db.publication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new NotFoundError("Publication");
  }

  const isOwner = publication.createdById === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You are not authorized to add documents to this publication.");
  }

  const document = await db.publicationDocument.create({
    data: {
      publicationId,
      fileName: documentData.fileName,
      fileType: documentData.fileType,
      filePath: documentData.filePath,
      fileSize: 0,
      documentType: documentData.documentType || DocumentType.MANUSCRIPT,
      uploadedById: user.id,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.DOCUMENT_UPLOAD,
      entityType: "PublicationDocument",
      entityId: document.id,
      details: { fileName: document.fileName, publicationId },
    },
  });

  revalidatePath(`/user/publications/${publicationId}`);
  revalidatePath(`/admin/publications/${publicationId}`);
  return { success: true, document };
}

export async function deletePublicationDocumentAction(
  publicationId: string,
  documentId: string
) {
  const user = await requireAuth();

  const document = await db.publicationDocument.findUnique({
    where: { id: documentId },
    include: { publication: true },
  });

  if (!document) {
    throw new NotFoundError("Document");
  }

  const isOwner = document.publication.createdById === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("You do not have permission to delete this document.");
  }

  const storageProvider = getStorageProvider();
  await storageProvider.deleteFile(document.filePath);

  await db.publicationDocument.delete({
    where: { id: documentId },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.DOCUMENT_DELETE,
      entityType: "PublicationDocument",
      entityId: documentId,
      details: { fileName: document.fileName, publicationId },
    },
  });

  revalidatePath(`/user/publications/${publicationId}`);
  revalidatePath(`/admin/publications/${publicationId}`);
  return { success: true };
}


export async function submitPublicationAction(publicationId: string) {
  const user = await requireAuth();

  const publication = await requirePublicationOwner(publicationId, user.id);
  assertPublicationEditable(publication);

  const submitted = await db.publication.update({
    where: { id: publicationId },
    data: {
      status: PublicationStatus.SUBMITTED,
      submissionDate: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.PUBLICATION_SUBMIT,
      entityType: "Publication",
      entityId: publicationId,
      details: { title: submitted.title },
    },
  });

  await sendPublicationSubmittedNotifications(
    submitted.id,
    user.id,
    submitted.title,
    user.name || user.email
  );

  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication: submitted };
}

export async function approvePublicationAction(publicationId: string, comment?: string) {
  const admin = await requireAdmin();

  const finalComment = comment?.trim() || "Approved by Administrator";

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    const approved = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.APPROVED,
        acceptanceDate: publication.acceptanceDate || new Date(),
      },
    });

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: ApprovalAction.APPROVED,
        comment: finalComment,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.PUBLICATION_APPROVE,
        entityType: "Publication",
        entityId: publicationId,
        details: { comment: finalComment, status: PublicationStatus.APPROVED },
      },
    });

    await tx.notification.create({
      data: {
        userId: publication.createdById,
        publicationId,
        type: NotificationType.PUBLICATION_APPROVED,
        title: "Publication Approved",
        message: `Your publication was approved.`,
      },
    });

    return approved;
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication: result };
}

export async function rejectPublicationAction(publicationId: string, comment: string) {
  const admin = await requireAdmin();

  if (!comment || !comment.trim()) {
    throw new ValidationError("A rejection reason is required.");
  }

  const finalComment = comment.trim();

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    const rejected = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.REJECTED,
      },
    });

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: ApprovalAction.REJECTED,
        comment: finalComment,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.PUBLICATION_REJECT,
        entityType: "Publication",
        entityId: publicationId,
        details: { comment: finalComment, status: PublicationStatus.REJECTED },
      },
    });

    await tx.notification.create({
      data: {
        userId: publication.createdById,
        publicationId,
        type: NotificationType.PUBLICATION_REJECTED,
        title: "Publication Rejected",
        message: `Your publication was rejected.`,
      },
    });

    return rejected;
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication: result };
}

export async function requestChangesAction(publicationId: string, comment: string) {
  const admin = await requireAdmin();

  if (!comment || !comment.trim()) {
    throw new ValidationError("An admin comment is required when requesting changes.");
  }

  const finalComment = comment.trim();

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    const updated = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.REVISION_REQUIRED,
      },
    });

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: ApprovalAction.REQUEST_CHANGES,
        comment: finalComment,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.PUBLICATION_REQUEST_CHANGES,
        entityType: "Publication",
        entityId: publicationId,
        details: { comment: finalComment, status: PublicationStatus.REVISION_REQUIRED },
      },
    });

    await tx.notification.create({
      data: {
        userId: publication.createdById,
        publicationId,
        type: NotificationType.CHANGES_REQUESTED,
        title: "Changes Required",
        message: `Changes are required for your publication.`,
      },
    });

    return updated;
  });

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  revalidatePath("/user/dashboard");
  return { success: true, publication: result };
}

export interface AdminUpdatePublicationInput {
  title?: string;
  publicationType?: PublicationType;
  departmentId?: string;
  researchAreaId?: string | null;
  journalId?: string | null;
  venueName?: string | null;
  publisher?: string | null;
  issn?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  isScopus?: boolean;
  isWebOfScience?: boolean;
  quartile?: ScopusQuartile;
  impactFactor?: number | null;
  submissionDate?: string | null;
  acceptanceDate?: string | null;
  publicationDate?: string | null;
  doi?: string | null;
  publicationUrl?: string | null;
  fundingAgency?: string | null;
  grantTitle?: string | null;
  grantAmountLakhs?: number | null;
  studentInvolvement?: StudentInvolvement;
  hasCollaboration?: boolean;
  externalCollaborators?: string | null;
}

export async function adminUpdatePublicationAction(
  publicationId: string,
  input: AdminUpdatePublicationInput
) {
  const admin = await requireAdmin();

  const existingPub = await db.publication.findUnique({
    where: { id: publicationId },
  });

  if (!existingPub) {
    throw new NotFoundError("Publication");
  }

  const updated = await db.publication.update({
    where: { id: publicationId },
    data: {
      title: input.title !== undefined ? input.title : existingPub.title,
      publicationType: input.publicationType || existingPub.publicationType,
      departmentId: input.departmentId || existingPub.departmentId,
      researchAreaId: input.researchAreaId !== undefined ? (input.researchAreaId || null) : existingPub.researchAreaId,
      journalId: input.journalId !== undefined ? (input.journalId || null) : existingPub.journalId,
      venueName: input.venueName !== undefined ? (input.venueName || null) : existingPub.venueName,
      publisher: input.publisher !== undefined ? (input.publisher || null) : existingPub.publisher,
      issn: input.issn !== undefined ? (input.issn || null) : existingPub.issn,
      volume: input.volume !== undefined ? (input.volume || null) : existingPub.volume,
      issue: input.issue !== undefined ? (input.issue || null) : existingPub.issue,
      pages: input.pages !== undefined ? (input.pages || null) : existingPub.pages,
      isScopus: input.isScopus !== undefined ? input.isScopus : existingPub.isScopus,
      isWebOfScience: input.isWebOfScience !== undefined ? input.isWebOfScience : existingPub.isWebOfScience,
      quartile: input.quartile || existingPub.quartile,
      impactFactor: input.impactFactor !== undefined ? input.impactFactor : existingPub.impactFactor,
      submissionDate: input.submissionDate ? new Date(input.submissionDate) : (input.submissionDate === null ? null : existingPub.submissionDate),
      acceptanceDate: input.acceptanceDate ? new Date(input.acceptanceDate) : (input.acceptanceDate === null ? null : existingPub.acceptanceDate),
      publicationDate: input.publicationDate ? new Date(input.publicationDate) : (input.publicationDate === null ? null : existingPub.publicationDate),
      doi: input.doi !== undefined ? (input.doi || null) : existingPub.doi,
      publicationUrl: input.publicationUrl !== undefined ? (input.publicationUrl || null) : existingPub.publicationUrl,
      fundingAgency: input.fundingAgency !== undefined ? (input.fundingAgency || null) : existingPub.fundingAgency,
      grantTitle: input.grantTitle !== undefined ? (input.grantTitle || null) : existingPub.grantTitle,
      grantAmountLakhs: input.grantAmountLakhs !== undefined ? input.grantAmountLakhs : existingPub.grantAmountLakhs,
      studentInvolvement: input.studentInvolvement || existingPub.studentInvolvement,
      hasCollaboration: input.hasCollaboration !== undefined ? input.hasCollaboration : existingPub.hasCollaboration,
      externalCollaborators: input.externalCollaborators !== undefined ? (input.externalCollaborators || null) : existingPub.externalCollaborators,
    },
  });

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: AuditAction.PUBLICATION_UPDATE,
      entityType: "Publication",
      entityId: publicationId,
      details: { title: updated.title, updatedFields: Object.keys(input) },
    },
  });

  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  return { success: true, publication: updated };
}

export async function adminChangeStatusAction(
  publicationId: string,
  newStatus: PublicationStatus,
  comment: string
) {
  const admin = await requireAdmin();

  if (!comment || !comment.trim()) {
    throw new ValidationError("A comment or justification is required for changing publication status.");
  }

  const finalComment = comment.trim();

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    const previousStatus = publication.status;

    const updated = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: newStatus,
        acceptanceDate:
          newStatus === PublicationStatus.APPROVED && !publication.acceptanceDate
            ? new Date()
            : publication.acceptanceDate,
        publicationDate:
          newStatus === PublicationStatus.PUBLISHED && !publication.publicationDate
            ? new Date()
            : publication.publicationDate,
      },
    });

    let approvalAction: ApprovalAction = ApprovalAction.STATUS_CHANGE;
    if (newStatus === PublicationStatus.APPROVED) approvalAction = ApprovalAction.APPROVED;
    else if (newStatus === PublicationStatus.REJECTED) approvalAction = ApprovalAction.REJECTED;
    else if (newStatus === PublicationStatus.REVISION_REQUIRED) approvalAction = ApprovalAction.REQUEST_CHANGES;
    else if (newStatus === PublicationStatus.ARCHIVED) approvalAction = ApprovalAction.ARCHIVED;

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: approvalAction,
        comment: `Status changed from ${previousStatus} to ${newStatus}: ${finalComment}`,
      },
    });

    let auditAction: AuditAction = AuditAction.PUBLICATION_STATUS_CHANGE;
    if (newStatus === PublicationStatus.APPROVED) auditAction = AuditAction.PUBLICATION_APPROVE;
    else if (newStatus === PublicationStatus.REJECTED) auditAction = AuditAction.PUBLICATION_REJECT;
    else if (newStatus === PublicationStatus.REVISION_REQUIRED) auditAction = AuditAction.PUBLICATION_REQUEST_CHANGES;
    else if (newStatus === PublicationStatus.ARCHIVED) auditAction = AuditAction.PUBLICATION_ARCHIVE;

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: auditAction,
        entityType: "Publication",
        entityId: publicationId,
        details: {
          previousStatus,
          newStatus,
          comment: finalComment,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: publication.createdById,
        publicationId,
        type:
          newStatus === PublicationStatus.APPROVED
            ? NotificationType.PUBLICATION_APPROVED
            : newStatus === PublicationStatus.REJECTED
            ? NotificationType.PUBLICATION_REJECTED
            : newStatus === PublicationStatus.REVISION_REQUIRED
            ? NotificationType.CHANGES_REQUESTED
            : NotificationType.SYSTEM_NOTICE,
        title: `Publication Status Updated to ${newStatus.replace("_", " ")}`,
        message: `Your publication status was updated to ${newStatus.replace("_", " ")}. Comment: ${finalComment}`,
      },
    });

    return updated;
  });

  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  return { success: true, publication: result };
}

export async function adminArchivePublicationAction(publicationId: string, reason: string) {
  const admin = await requireAdmin();

  if (!reason || !reason.trim()) {
    throw new ValidationError("An archival reason is required.");
  }

  const finalReason = reason.trim();

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    const previousStatus = publication.status;

    const archived = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.ARCHIVED,
      },
    });

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: ApprovalAction.ARCHIVED,
        comment: `Archived record (was ${previousStatus}): ${finalReason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.PUBLICATION_ARCHIVE,
        entityType: "Publication",
        entityId: publicationId,
        details: { previousStatus, reason: finalReason },
      },
    });

    return archived;
  });

  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  return { success: true, publication: result };
}

export async function adminRestorePublicationAction(publicationId: string) {
  const admin = await requireAdmin();

  const result = await db.$transaction(async (tx) => {
    const publication = await tx.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw new NotFoundError("Publication");
    }

    if (publication.status !== PublicationStatus.ARCHIVED) {
      throw new ValidationError("Only archived publications can be restored.");
    }

    const restored = await tx.publication.update({
      where: { id: publicationId },
      data: {
        status: PublicationStatus.SUBMITTED,
      },
    });

    await tx.approval.create({
      data: {
        publicationId,
        adminId: admin.id,
        action: ApprovalAction.STATUS_CHANGE,
        comment: "Restored publication from archive to SUBMITTED status.",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.PUBLICATION_RESTORE,
        entityType: "Publication",
        entityId: publicationId,
        details: { restoredToStatus: PublicationStatus.SUBMITTED },
      },
    });

    return restored;
  });

  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  return { success: true, publication: result };
}

export async function adminDeletePublicationAction(publicationId: string) {
  const admin = await requireAdmin();

  const publication = await db.publication.findUnique({
    where: { id: publicationId },
    include: {
      approvals: true,
      documents: true,
    },
  });

  if (!publication) {
    throw new NotFoundError("Publication");
  }

  // Enforce Business Rule: Avoid permanent deletion when historical reporting depends on record.
  const preservesHistoricalReporting =
    publication.status === PublicationStatus.APPROVED ||
    publication.status === PublicationStatus.PUBLISHED ||
    publication.status === PublicationStatus.REJECTED ||
    publication.approvals.length > 0;

  if (preservesHistoricalReporting) {
    throw new ValidationError(
      "Permanent deletion is prohibited for records with historical approvals or reporting dependencies. Please use Soft Delete / Archive instead."
    );
  }

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: AuditAction.PUBLICATION_DELETE,
      entityType: "Publication",
      entityId: publicationId,
      details: { title: publication.title, status: publication.status },
    },
  });

  await db.publication.delete({
    where: { id: publicationId },
  });

  revalidatePath("/admin/publications");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");
  return { success: true };
}

