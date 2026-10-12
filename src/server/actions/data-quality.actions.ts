"use server";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { NotFoundError } from "@/lib/errors";
import { AuditAction, ScopusQuartile, PublicationType } from "@prisma/client";
import { revalidatePath as nextRevalidatePath } from "next/cache";
import {
  getDataQualityOverview,
  getAffectedPublications,
  QualityMetricKey,
} from "@/server/services/data-quality.service";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch {
    // Suppress static generation store error when executing in CLI test scripts
  }
}

export interface FixDataQualityInput {
  metricKey?: QualityMetricKey;
  adminComment?: string;
  title?: string;
  publicationType?: PublicationType;
  departmentId?: string;
  venueName?: string | null;
  doi?: string | null;
  quartile?: ScopusQuartile;
  isScopus?: boolean;
  isWebOfScience?: boolean;
  submissionDate?: string | null;
  acceptanceDate?: string | null;
  publicationDate?: string | null;
}

export async function getDataQualityOverviewAction() {
  await requireAdmin();
  const overview = await getDataQualityOverview();
  return { success: true, overview };
}

export async function getAffectedPublicationsAction(metricKey: QualityMetricKey) {
  await requireAdmin();
  const publications = await getAffectedPublications(metricKey);
  return { success: true, publications };
}

export async function fixDataQualityIssueAction(
  publicationId: string,
  input: FixDataQualityInput
) {
  const admin = await requireAdmin();

  const existingPub = await db.publication.findUnique({
    where: { id: publicationId },
  });

  if (!existingPub) {
    throw new NotFoundError("Publication");
  }

  // Construct change set and keep track of previous values for AuditLog
  const updateData: Record<string, unknown> = {};
  const previousValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  if (input.title !== undefined && input.title !== existingPub.title) {
    updateData.title = input.title;
    previousValues.title = existingPub.title;
    newValues.title = input.title;
  }

  if (input.publicationType !== undefined && input.publicationType !== existingPub.publicationType) {
    updateData.publicationType = input.publicationType;
    previousValues.publicationType = existingPub.publicationType;
    newValues.publicationType = input.publicationType;
  }

  if (input.departmentId !== undefined && input.departmentId !== existingPub.departmentId) {
    updateData.departmentId = input.departmentId;
    previousValues.departmentId = existingPub.departmentId;
    newValues.departmentId = input.departmentId;
  }

  if (input.venueName !== undefined && input.venueName !== existingPub.venueName) {
    updateData.venueName = input.venueName;
    previousValues.venueName = existingPub.venueName;
    newValues.venueName = input.venueName;
  }

  if (input.doi !== undefined && input.doi !== existingPub.doi) {
    updateData.doi = input.doi ? input.doi.trim() : null;
    previousValues.doi = existingPub.doi;
    newValues.doi = updateData.doi;
  }

  if (input.quartile !== undefined && input.quartile !== existingPub.quartile) {
    updateData.quartile = input.quartile;
    previousValues.quartile = existingPub.quartile;
    newValues.quartile = input.quartile;
  }

  if (input.isScopus !== undefined && input.isScopus !== existingPub.isScopus) {
    updateData.isScopus = input.isScopus;
    previousValues.isScopus = existingPub.isScopus;
    newValues.isScopus = input.isScopus;
  }

  if (input.isWebOfScience !== undefined && input.isWebOfScience !== existingPub.isWebOfScience) {
    updateData.isWebOfScience = input.isWebOfScience;
    previousValues.isWebOfScience = existingPub.isWebOfScience;
    newValues.isWebOfScience = input.isWebOfScience;
  }

  if (input.submissionDate !== undefined) {
    const newSubDate = input.submissionDate ? new Date(input.submissionDate) : null;
    const oldSubTime = existingPub.submissionDate ? new Date(existingPub.submissionDate).getTime() : null;
    const newSubTime = newSubDate ? newSubDate.getTime() : null;
    if (oldSubTime !== newSubTime) {
      updateData.submissionDate = newSubDate;
      previousValues.submissionDate = existingPub.submissionDate;
      newValues.submissionDate = newSubDate;
    }
  }

  if (input.acceptanceDate !== undefined) {
    const newAccDate = input.acceptanceDate ? new Date(input.acceptanceDate) : null;
    const oldAccTime = existingPub.acceptanceDate ? new Date(existingPub.acceptanceDate).getTime() : null;
    const newAccTime = newAccDate ? newAccDate.getTime() : null;
    if (oldAccTime !== newAccTime) {
      updateData.acceptanceDate = newAccDate;
      previousValues.acceptanceDate = existingPub.acceptanceDate;
      newValues.acceptanceDate = newAccDate;
    }
  }

  if (input.publicationDate !== undefined) {
    const newPubDate = input.publicationDate ? new Date(input.publicationDate) : null;
    const oldPubTime = existingPub.publicationDate ? new Date(existingPub.publicationDate).getTime() : null;
    const newPubTime = newPubDate ? newPubDate.getTime() : null;
    if (oldPubTime !== newPubTime) {
      updateData.publicationDate = newPubDate;
      previousValues.publicationDate = existingPub.publicationDate;
      newValues.publicationDate = newPubDate;
    }
  }

  // Perform update if changes exist
  const updatedPub = await db.publication.update({
    where: { id: publicationId },
    data: updateData,
  });

  // Record AuditLog entry to audit data quality correction
  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: AuditAction.PUBLICATION_UPDATE,
      entityType: "Publication",
      entityId: publicationId,
      details: JSON.parse(JSON.stringify({
        actionReason: "DATA_QUALITY_FIX",
        metricKey: input.metricKey || "MANUAL_FIX",
        changedFields: Object.keys(newValues),
        previousValues,
        newValues,
        adminComment: input.adminComment || "Data quality issue correction",
      })),
    },
  });

  revalidatePath("/admin/data-quality");
  revalidatePath("/admin/publications");
  revalidatePath(`/admin/publications/${publicationId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/user/publications");

  return { success: true, publication: updatedPub };
}
