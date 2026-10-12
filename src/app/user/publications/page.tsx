import React from "react";
import { requireAuth } from "@/lib/auth-helpers";
import db from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  AlertTriangle,
  Eye,
  Edit,
} from "lucide-react";



export default async function UserPublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const user = await requireAuth();
  const { status, search } = await searchParams;

  // Query user-owned publications strictly from DB
  const rawPublications = await db.publication.findMany({
    where: { createdById: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      department: true,
      journal: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      documents: true,
    },
  });

  // Client-safe filtering
  let publications = rawPublications;
  if (status && status !== "ALL") {
    publications = publications.filter((p) => p.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    publications = publications.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.venueName && p.venueName.toLowerCase().includes(q)) ||
        (p.journal?.name && p.journal.name.toLowerCase().includes(q))
    );
  }

  const statuses = [
    { label: "All", value: "ALL", count: rawPublications.length },
    { label: "Drafts", value: "DRAFT", count: rawPublications.filter((p) => p.status === "DRAFT").length },
    { label: "Submitted", value: "SUBMITTED", count: rawPublications.filter((p) => p.status === "SUBMITTED").length },
    { label: "Revision Required", value: "REVISION_REQUIRED", count: rawPublications.filter((p) => p.status === "REVISION_REQUIRED").length },
    { label: "Approved", value: "APPROVED", count: rawPublications.filter((p) => p.status === "APPROVED").length },
    { label: "Published", value: "PUBLISHED", count: rawPublications.filter((p) => p.status === "PUBLISHED").length },
    { label: "Rejected", value: "REJECTED", count: rawPublications.filter((p) => p.status === "REJECTED").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-500" />
            <span>My Research Publications & Submissions</span>
          </h1>
          <p className="text-xs text-slate-500">
            View status, edit drafts, resubmit revision requests, and upload supporting documents.
          </p>
        </div>

        <Link
          href="/user/publications/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Submission</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {statuses.map((s) => {
          const isActive = (status || "ALL") === s.value;
          return (
            <Link
              key={s.value}
              href={`/user/publications?status=${s.value}${search ? `&search=${search}` : ""}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s.label} ({s.count})
            </Link>
          );
        })}
      </div>

      {/* Publications List */}
      {publications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-800">No publications found</h2>
          <p className="mt-1 text-xs text-slate-500">
            Click &quot;New Submission&quot; to register your latest paper.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {publications.map((pub) => {
            const isEditable = pub.status === "DRAFT" || pub.status === "REVISION_REQUIRED";
            const latestApproval = pub.approvals[0];

            return (
              <div
                key={pub.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {pub.publicationType.replace("_", " ")}
                      </span>
                      {pub.quartile && pub.quartile !== "UNSPECIFIED" && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                          {pub.quartile}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-500">
                        {pub.department.code}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 leading-snug">
                      <Link href={`/user/publications/${pub.id}`} className="hover:text-amber-600">
                        {pub.title}
                      </Link>
                    </h2>

                    <p className="text-[11px] text-slate-500">
                      {pub.journal?.name || pub.venueName || "NIE Mysore Research Portal"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                      pub.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : pub.status === "PUBLISHED"
                        ? "bg-purple-100 text-purple-800"
                        : pub.status === "REVISION_REQUIRED"
                        ? "bg-amber-100 text-amber-800"
                        : pub.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : pub.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {pub.status}
                  </span>
                </div>

                {/* Reviewer Feedback banner if Revision Required */}
                {pub.status === "REVISION_REQUIRED" && latestApproval?.comment && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Admin Feedback Prominent Comment: </span>
                      <span>{latestApproval.comment}</span>
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>
                      Submitted:{" "}
                      {pub.submissionDate
                        ? new Date(pub.submissionDate).toLocaleDateString("en-IN")
                        : "Not submitted"}
                    </span>
                    <span>• {pub.documents.length} Document(s)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/user/publications/${pub.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </Link>

                    {isEditable && (
                      <Link
                        href={`/user/publications/${pub.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit / Resubmit</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
