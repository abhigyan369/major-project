import React from "react";
import { requireUser } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicationForm } from "@/components/publications/publication-form";
import { PublicationDocumentManager } from "@/components/publications/publication-document-manager";
import {
  BookOpen,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Edit3,
} from "lucide-react";


export default async function PublicationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  // 1. Server-side Security & Ownership Check (IDOR Protection)
  const publication = await db.publication.findUnique({
    where: { id },
    include: {
      department: true,
      journal: true,
      researchArea: true,
      createdBy: true,
      authors: {
        orderBy: { authorOrder: "asc" },
      },
      approvals: {
        orderBy: { createdAt: "desc" },
        include: {
          admin: true,
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: true,
        },
      },
    },
  });

  if (!publication) {
    notFound();
  }

  // Strictly enforce server-side ownership guard
  if (publication.createdById !== user.id) {
    return (
      <div className="max-w-2xl mx-auto my-12 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="text-lg font-bold text-red-400">Access Denied (403 Forbidden)</h1>
        <p className="text-xs text-red-300">
          You do not have permission to view or edit this publication. Server-side ownership verification failed.
        </p>
        <Link
          href="/user/dashboard"
          className="inline-block rounded-xl bg-red-500 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-red-600"
        >
          Return to My Dashboard
        </Link>
      </div>
    );
  }

  const isEditable = publication.status === "DRAFT" || publication.status === "REVISION_REQUIRED";
  const latestApproval = publication.approvals[0];

  const departments = await db.department.findMany({ orderBy: { code: "asc" } });
  const journals = await db.journal.findMany({ orderBy: { name: "asc" } });
  const researchAreas = await db.researchArea.findMany({ orderBy: { name: "asc" } });

  const rawAuthorsString = publication.authors.map((a) => a.authorName).join(", ");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/user/publications"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  publication.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : publication.status === "PUBLISHED"
                    ? "bg-purple-100 text-purple-800"
                    : publication.status === "REVISION_REQUIRED"
                    ? "bg-amber-100 text-amber-800"
                    : publication.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : publication.status === "SUBMITTED"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {publication.status}
              </span>
              <span className="text-xs text-slate-400">
                ID: {publication.id.slice(-8)}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1 line-clamp-2">
              {publication.title}
            </h1>
          </div>
        </div>
      </div>

      {/* PROMINENT ADMIN FEEDBACK BANNER (For REVISION_REQUIRED status) */}
      {publication.status === "REVISION_REQUIRED" && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-500/10 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>Admin Revisions Requested — Feedback Details</span>
          </div>
          <p className="text-xs text-amber-900 font-semibold leading-relaxed bg-white/80 rounded-xl p-3.5 border border-amber-200">
            {latestApproval?.comment || "Please review manuscript details and resubmit for administrator evaluation."}
          </p>
          <p className="text-[11px] text-amber-700">
            Edit the form below and click <strong>Submit for Approval</strong> to resubmit this paper to the admin review queue.
          </p>
        </div>
      )}

      {/* Timeline Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Publication Pipeline Timeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400">Created</p>
              <p className="font-bold text-slate-800">
                {new Date(publication.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-[10px] text-slate-400">Submitted</p>
              <p className="font-bold text-slate-800">
                {publication.submissionDate
                  ? new Date(publication.submissionDate).toLocaleDateString("en-IN")
                  : "Not Submitted"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-400">Acceptance</p>
              <p className="font-bold text-slate-800">
                {publication.acceptanceDate
                  ? new Date(publication.acceptanceDate).toLocaleDateString("en-IN")
                  : "Pending"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <BookOpen className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-[10px] text-slate-400">Published</p>
              <p className="font-bold text-slate-800">
                {publication.publicationDate
                  ? new Date(publication.publicationDate).toLocaleDateString("en-IN")
                  : "Not Published"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Documents Manager */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PublicationDocumentManager
          publicationId={publication.id}
          documents={publication.documents}
          canEdit={isEditable}
        />
      </div>

      {/* Approval & Review History */}
      {publication.approvals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>Approval & Review History</span>
          </h3>

          <div className="space-y-3">
            {publication.approvals.map((app) => (
              <div
                key={app.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {app.admin.name || app.admin.email}
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {app.action}
                    </span>
                  </div>
                  {app.comment && (
                    <p className="text-slate-600 italic leading-relaxed">&quot;{app.comment}&quot;</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(app.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT / RESUBMIT FORM OR READ-ONLY METADATA */}
      {isEditable ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {publication.status === "REVISION_REQUIRED"
                ? "Edit & Resubmit Manuscript"
                : "Edit Draft Details"}
            </h2>
          </div>

          <PublicationForm
            initialData={{
              id: publication.id,
              title: publication.title,
              publicationType: publication.publicationType,
              rawAuthors: rawAuthorsString,
              correspondingAuthorName: publication.correspondingAuthorName || "",
              departmentId: publication.departmentId,
              researchAreaId: publication.researchAreaId || "",
              journalId: publication.journalId || "",
              venueName: publication.venueName || "",
              publisher: publication.publisher || "",
              issn: publication.issn || "",
              volume: publication.volume || "",
              issue: publication.issue || "",
              pages: publication.pages || "",
              isScopus: publication.isScopus,
              isWebOfScience: publication.isWebOfScience,
              quartile: publication.quartile,
              impactFactor: publication.impactFactor ? Number(publication.impactFactor) : null,
              submissionDate: publication.submissionDate ? publication.submissionDate.toISOString() : null,
              acceptanceDate: publication.acceptanceDate ? publication.acceptanceDate.toISOString() : null,
              publicationDate: publication.publicationDate ? publication.publicationDate.toISOString() : null,
              doi: publication.doi || "",
              publicationUrl: publication.publicationUrl || "",
              fundingAgency: publication.fundingAgency || "",
              grantTitle: publication.grantTitle || "",
              grantAmountLakhs: publication.grantAmountLakhs ? Number(publication.grantAmountLakhs) : null,
              studentInvolvement: publication.studentInvolvement,
              hasCollaboration: publication.hasCollaboration,
              externalCollaborators: publication.externalCollaborators || "",
            }}
            departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
            journals={journals.map((j) => ({ id: j.id, name: j.name, scopusQuartile: j.scopusQuartile }))}
            researchAreas={researchAreas.map((ra) => ({ id: ra.id, name: ra.name }))}
            userDefaultDepartmentId={user.departmentId || undefined}
          />
        </div>
      ) : (
        /* Read-only details view */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 text-xs text-slate-700">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Full Publication Information (Read Only)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-slate-400">Department</p>
              <p className="font-bold text-slate-800">{publication.department.name} ({publication.department.code})</p>
            </div>

            <div>
              <p className="font-semibold text-slate-400">Authors</p>
              <p className="font-bold text-slate-800">{rawAuthorsString || "Faculty Author"}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-400">Journal / Venue</p>
              <p className="font-bold text-slate-800">{publication.journal?.name || publication.venueName || "NIE Research Portal"}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-400">Indexing</p>
              <p className="font-bold text-slate-800">
                {publication.isScopus ? "Scopus " : ""}
                {publication.isWebOfScience ? "• Web of Science " : ""}
                {publication.quartile ? `(${publication.quartile})` : ""}
              </p>
            </div>

            {publication.doi && (
              <div>
                <p className="font-semibold text-slate-400">DOI</p>
                <p className="font-bold text-slate-800">{publication.doi}</p>
              </div>
            )}

            {publication.publicationUrl && (
              <div>
                <p className="font-semibold text-slate-400">Publication URL</p>
                <a
                  href={publication.publicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  <span>Link to Paper</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
