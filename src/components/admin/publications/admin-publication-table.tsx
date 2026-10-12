"use client";

import React from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { AdminStatusChangeModal } from "./admin-status-change-modal";
import { AdminDeleteArchiveModal } from "./admin-delete-archive-modal";
import { AdminPublicationEditModal } from "./admin-publication-edit-modal";
import { PublicationType, PublicationStatus, ScopusQuartile, StudentInvolvement } from "@prisma/client";
import {
  BookOpen,
  User,
  Calendar,
  ExternalLink,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface AdminPublicationTableProps {
  publications: Array<{
    id: string;
    title: string;
    publicationType: PublicationType;
    department: {
      code: string;
      name: string;
      campus: { name: string };
    };
    departmentId: string;
    journal?: { name: string } | null;
    venueName?: string | null;
    createdBy: { name: string | null; email: string };
    createdAt: Date | string;
    submissionDate?: Date | string | null;
    status: PublicationStatus | string;
    quartile: ScopusQuartile;
    isWebOfScience: boolean;
    isScopus: boolean;
    doi?: string | null;
    studentInvolvement: StudentInvolvement;
    approvals?: Array<{
      id: string;
      comment?: string | null;
      admin?: { name: string | null; email: string } | null;
    }>;
    [key: string]: unknown;
  }>;
  departments: Array<{
    id: string;
    code: string;
    name: string;
    [key: string]: unknown;
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export function AdminPublicationTable({
  publications,
  departments,
  totalCount,
  currentPage,
  totalPages,
  limit,
}: AdminPublicationTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRecord = Math.min(totalCount, currentPage * limit);

  return (
    <div className="space-y-4">
      {/* List Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {publications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-800">No publications found matching criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, department filter, or status filter options above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {publications.map((pub) => {
              const latestApproval = pub.approvals?.[0];
              const hasReportingDependencies =
                pub.status === "APPROVED" ||
                pub.status === "PUBLISHED" ||
                pub.status === "REJECTED" ||
                (pub.approvals && pub.approvals.length > 0);

              return (
                <div
                  key={pub.id}
                  className={`p-5 transition-all hover:bg-slate-50/80 space-y-3 ${
                    pub.status === "ARCHIVED" ? "bg-slate-50/60 opacity-85" : ""
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Main Title & Submitter Meta */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Department Badge */}
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 border border-amber-200">
                          {pub.department.code} • {pub.department.campus.name}
                        </span>

                        {/* Pub Type */}
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {pub.publicationType.replace("_", " ")}
                        </span>

                        {/* Quartile Badge */}
                        {pub.quartile && pub.quartile !== "UNSPECIFIED" && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${
                              pub.quartile === "Q1"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : pub.quartile === "Q2"
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : pub.quartile === "Q3"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {pub.quartile}
                          </span>
                        )}

                        {/* WoS Badge */}
                        {pub.isWebOfScience && (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            Web of Science
                          </span>
                        )}

                        {/* Scopus Badge */}
                        {pub.isScopus && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Scopus
                          </span>
                        )}
                      </div>

                      {/* Title Link */}
                      <Link
                        href={`/admin/publications/${pub.id}`}
                        className="text-sm lg:text-base font-bold text-slate-900 hover:text-amber-600 leading-snug block transition-colors"
                      >
                        {pub.title}
                      </Link>

                      {/* Author & Journal details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>
                            Faculty Submitter:{" "}
                            <strong className="text-slate-800">
                              {pub.createdBy.name || pub.createdBy.email}
                            </strong>
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Submitted: {formatDate(pub.submissionDate || pub.createdAt)}</span>
                        </span>

                        {pub.journal && (
                          <span className="truncate max-w-xs">
                            Journal: <span className="font-semibold text-slate-800">{pub.journal.name}</span>
                          </span>
                        )}

                        {pub.doi && (
                          <a
                            href={`https://doi.org/${pub.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-600 hover:underline flex items-center gap-0.5 font-mono text-[10px]"
                          >
                            <span>DOI: {pub.doi}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Primary Detail Link */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                      <span
                        className={`rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide border shadow-sm ${
                          pub.status === "APPROVED" || pub.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : pub.status === "REVISION_REQUIRED"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : pub.status === "REJECTED"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : pub.status === "ARCHIVED"
                            ? "bg-slate-200 text-slate-700 border-slate-300"
                            : "bg-blue-100 text-blue-800 border-blue-300"
                        }`}
                      >
                        {pub.status}
                      </span>

                      <Link
                        href={`/admin/publications/${pub.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details & Stepper</span>
                      </Link>
                    </div>
                  </div>

                  {/* Admin Toolbar Actions Row */}
                  <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusChangeModal
                        publicationId={pub.id}
                        title={pub.title}
                        currentStatus={pub.status}
                      />

                      <AdminPublicationEditModal
                        publication={pub}
                        departments={departments}
                      />

                      <AdminDeleteArchiveModal
                        publicationId={pub.id}
                        title={pub.title}
                        currentStatus={pub.status}
                        hasApprovalsOrDependencies={hasReportingDependencies}
                      />
                    </div>

                    {latestApproval?.comment && (
                      <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                        <span className="font-bold text-slate-700 not-italic">Latest Action:</span> &quot;
                        {latestApproval.comment}&quot; by{" "}
                        <span className="font-semibold not-italic">
                          {latestApproval.admin?.name || latestApproval.admin?.email}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
          <div className="text-slate-500">
            Showing <span className="font-bold text-slate-900">{startRecord}</span> to{" "}
            <span className="font-bold text-slate-900">{endRecord}</span> of{" "}
            <span className="font-bold text-slate-900">{totalCount}</span> publications
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (
                  pg === 1 ||
                  pg === totalPages ||
                  (pg >= currentPage - 1 && pg <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => handlePageChange(pg)}
                      className={`h-8 w-8 rounded-xl font-bold text-xs transition-all ${
                        pg === currentPage
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                }
                if (pg === 2 && currentPage > 3) {
                  return <span key="ellipsis-start" className="px-1 text-slate-400">...</span>;
                }
                if (pg === totalPages - 1 && currentPage < totalPages - 2) {
                  return <span key="ellipsis-end" className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
