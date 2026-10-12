import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import Link from "next/link";
import { formatDate, formatCurrencyLakhs } from "@/lib/utils";
import { PublicationLifecycleStepper } from "@/components/admin/publications/publication-lifecycle-stepper";
import { PublicationAuditTrail, AuditTrailEvent } from "@/components/admin/publications/publication-audit-trail";
import { AdminStatusChangeModal } from "@/components/admin/publications/admin-status-change-modal";
import { AdminPublicationEditModal } from "@/components/admin/publications/admin-publication-edit-modal";
import { AdminDeleteArchiveModal } from "@/components/admin/publications/admin-delete-archive-modal";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  FileText,
  ExternalLink,
  Award,
  DollarSign,
  Clock,
  Download,
} from "lucide-react";

interface ReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminPublicationReviewPage({ params }: ReviewPageProps) {
  await requireAdmin();

  const { id: publicationId } = await params;

  // Query publication details, departments list for edit modal, approvals, and audit logs
  const [publication, departments, auditLogs] = await Promise.all([
    db.publication.findUnique({
      where: { id: publicationId },
      include: {
        department: { include: { campus: true } },
        journal: true,
        researchArea: true,
        createdBy: { include: { department: true } },
        correspondingAuthor: true,
        authors: {
          orderBy: { authorOrder: "asc" },
          include: { user: true },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: true },
        },
        approvals: {
          orderBy: { createdAt: "desc" },
          include: { admin: true },
        },
      },
    }),
    db.department.findMany({
      orderBy: { code: "asc" },
    }),
    db.auditLog.findMany({
      where: {
        entityId: publicationId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    }),
  ]);

  if (!publication) {
    throw new NotFoundError("Publication");
  }

  // Combine approvals and audit logs into a unified chronological timeline
  const approvalEvents: AuditTrailEvent[] = publication.approvals.map((app) => ({
    id: `approval-${app.id}`,
    type: "approval",
    action: `APPROVAL_${app.action}`,
    user: app.admin,
    comment: app.comment,
    createdAt: app.createdAt,
  }));

  const auditEvents: AuditTrailEvent[] = auditLogs.map((log) => ({
    id: `audit-${log.id}`,
    type: "audit",
    action: log.action,
    user: log.user,
    comment: (log.details as Record<string, unknown>)?.comment as string || (log.details as Record<string, unknown>)?.reason as string || null,
    details: log.details as Record<string, unknown>,
    createdAt: log.createdAt,
  }));

  const unifiedEvents = [...approvalEvents, ...auditEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const latestApproval = publication.approvals[0];
  const hasReportingDependencies =
    publication.status === "APPROVED" ||
    publication.status === "PUBLISHED" ||
    publication.status === "REJECTED" ||
    publication.approvals.length > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/publications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Master Publications List</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">ID: {publication.id}</span>
      </div>

      {/* Main Banner Header */}
      <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                {publication.department.code} • {publication.department.campus.name}
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                {publication.publicationType.replace("_", " ")}
              </span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide ${
                  publication.status === "APPROVED" || publication.status === "PUBLISHED"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : publication.status === "REVISION_REQUIRED"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : publication.status === "REJECTED"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : publication.status === "ARCHIVED"
                    ? "bg-slate-700 text-slate-300 border border-slate-600"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                }`}
              >
                {publication.status}
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-tight">
              {publication.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-amber-400" />
                <span>Submitter: <strong className="text-slate-200">{publication.createdBy.name || publication.createdBy.email}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Submitted: <strong className="text-slate-200">{formatDate(publication.submissionDate || publication.createdAt)}</strong></span>
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="shrink-0 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center lg:text-left">
              Admin Actions & Management
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusChangeModal
                publicationId={publication.id}
                title={publication.title}
                currentStatus={publication.status}
              />
              <AdminPublicationEditModal
                publication={publication}
                departments={departments}
              />
              <AdminDeleteArchiveModal
                publicationId={publication.id}
                title={publication.title}
                currentStatus={publication.status}
                hasApprovalsOrDependencies={hasReportingDependencies}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Lifecycle Stepper Progress */}
      <PublicationLifecycleStepper
        publicationStatus={publication.status}
        createdAt={publication.createdAt}
        submissionDate={publication.submissionDate}
        acceptanceDate={publication.acceptanceDate}
        publicationDate={publication.publicationDate}
        latestComment={latestApproval?.comment}
      />

      {/* Main Grid: Details & Indexing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Full Review Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submitter & Department Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-amber-500" />
              <span>Submitter Information</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Faculty Name</span>
                <span className="font-semibold text-slate-900">{publication.createdBy.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Address</span>
                <span className="font-semibold text-slate-900">{publication.createdBy.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Department</span>
                <span className="font-semibold text-slate-900">{publication.department.name} ({publication.department.code})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Campus Location</span>
                <span className="font-semibold text-slate-900">{publication.department.campus.name}</span>
              </div>
            </div>
          </div>

          {/* Authors List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Users className="h-4 w-4 text-amber-500" />
              <span>Authors Roster ({publication.authors.length})</span>
            </h2>

            <div className="space-y-2">
              {publication.authors.map((author) => (
                <div
                  key={author.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-800 font-bold text-[11px]">
                      {author.authorOrder}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {author.authorName}
                        {author.isCorresponding && (
                          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800">
                            Corresponding Author
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {author.affiliation || "The National Institute of Engineering, Mysuru"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {author.isInternal ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Internal Faculty
                      </span>
                    ) : (
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        External Co-Author
                      </span>
                    )}
                    {author.isStudent && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        Student
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indexing & Journal Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Journal & Quality Indexing</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Journal Name</span>
                <span className="font-semibold text-slate-900">{publication.journal?.name || publication.venueName || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Publisher</span>
                <span className="font-semibold text-slate-900">{publication.journal?.publisher || publication.publisher || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">ISSN / eISSN</span>
                <span className="font-semibold text-slate-900">{publication.issn || publication.journal?.issn || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Scopus Quartile</span>
                <span className="font-bold text-purple-700">{publication.quartile || publication.journal?.scopusQuartile || "UNSPECIFIED"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Impact Factor</span>
                <span className="font-semibold text-slate-900">
                  {publication.impactFactor ? String(publication.impactFactor) : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Citations Count</span>
                <span className="font-semibold text-slate-900">{publication.citationCount}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${publication.isScopus ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                Scopus Indexed: {publication.isScopus ? "Yes" : "No"}
              </span>
              <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${publication.isWebOfScience ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}>
                Web of Science: {publication.isWebOfScience ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Attached Documents */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 text-amber-500" />
              <span>Uploaded Documents ({publication.documents.length})</span>
            </h2>

            {publication.documents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No files uploaded yet for this submission.</p>
            ) : (
              <div className="space-y-2">
                {publication.documents.map((doc) => {
                  const fileSizeFormatted = doc.fileSize > 0
                    ? `${(doc.fileSize / (1024 * 1024)).toFixed(1)} MB`
                    : null;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-500">
                            Uploaded by {doc.uploadedBy.name || doc.uploadedBy.email} on {formatDate(doc.createdAt)}
                            {fileSizeFormatted ? ` • ${fileSizeFormatted}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                          {doc.documentType.replace("_", " ")}
                        </span>
                        <a
                          href={`/api/documents/${doc.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors"
                          title="View Document Stream"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View</span>
                        </a>
                        <a
                          href={`/api/documents/${doc.id}?download=true`}
                          download={doc.fileName}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors"
                          title="Download Document File"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Dates, Financials & Complete Audit Trail Timeline */}
        <div className="space-y-6">
          {/* Pipeline Dates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Pipeline Dates</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Submission Date</span>
                <span className="font-semibold text-slate-900">{formatDate(publication.submissionDate)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Acceptance Date</span>
                <span className="font-semibold text-slate-900">{formatDate(publication.acceptanceDate)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-500">Publication Date</span>
                <span className="font-semibold text-slate-900">{formatDate(publication.publicationDate)}</span>
              </div>
            </div>
          </div>

          {/* DOI & URL */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <ExternalLink className="h-4 w-4 text-amber-500" />
              <span>DOI & External Links</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">DOI Number</span>
                {publication.doi ? (
                  <a
                    href={`https://doi.org/${publication.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-amber-600 hover:underline flex items-center gap-1"
                  >
                    <span>{publication.doi}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Publication URL</span>
                {publication.publicationUrl ? (
                  <a
                    href={publication.publicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-amber-600 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{publication.publicationUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Financials & Funding */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span>Funding & Collaborations</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Funding Agency</span>
                <span className="font-semibold text-slate-900">{publication.fundingAgency || "Self-Funded / Internal"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Grant Amount</span>
                <span className="font-semibold text-emerald-700">
                  {publication.grantAmountLakhs ? formatCurrencyLakhs(Number(publication.grantAmountLakhs)) : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Student Involvement</span>
                <span className="font-semibold text-slate-900">{publication.studentInvolvement}</span>
              </div>
            </div>
          </div>

          {/* Unified Audit Trail Component */}
          <PublicationAuditTrail events={unifiedEvents} />
        </div>
      </div>
    </div>
  );
}
