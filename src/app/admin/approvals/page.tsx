import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import db from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ApprovalFilters } from "@/components/admin/approval-filters";
import { ApprovalActionsModal } from "@/components/admin/approval-actions-modal";
import {
  ShieldCheck,
  Eye,
  User,
  Calendar,
  Building2,
  AlertCircle,
} from "lucide-react";
import { PublicationStatus, PublicationType, ScopusQuartile, Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    department?: string;
    campus?: string;
    publicationType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    faculty?: string;
    quartile?: string;
  }>;
}

export default async function AdminApprovalsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const {
    department,
    campus,
    publicationType,
    status = "SUBMITTED",
    dateFrom,
    dateTo,
    faculty,
    quartile,
  } = params;

  // Query departments for filter dropdown
  const departments = await db.department.findMany({
    orderBy: { code: "asc" },
    include: { campus: true },
  });

  // Construct Prisma WHERE clause dynamically
  const whereClause: Prisma.PublicationWhereInput = {};

  // Status Filter
  if (status && status !== "ALL") {
    whereClause.status = status as PublicationStatus;
  }

  // Department Filter
  if (department) {
    whereClause.departmentId = department;
  }

  // Campus Filter
  if (campus) {
    whereClause.department = {
      campus: {
        code: campus,
      },
    };
  }

  // Publication Type Filter
  if (publicationType) {
    whereClause.publicationType = publicationType as PublicationType;
  }

  // Quartile Filter
  if (quartile) {
    whereClause.quartile = quartile as ScopusQuartile;
  }

  // Date Range Filter (Submission Date)
  if (dateFrom || dateTo) {
    whereClause.submissionDate = {};
    if (dateFrom) {
      whereClause.submissionDate.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.submissionDate.lte = endOfDay;
    }
  }

  // Faculty Search Filter
  if (faculty) {
    whereClause.OR = [
      { createdBy: { name: { contains: faculty, mode: "insensitive" } } },
      { createdBy: { email: { contains: faculty, mode: "insensitive" } } },
      { authors: { some: { authorName: { contains: faculty, mode: "insensitive" } } } },
    ];
  }

  // Query publications with relations
  const publications = await db.publication.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      department: { include: { campus: true } },
      journal: true,
      createdBy: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { admin: true },
      },
    },
  });

  const formattedDepts = departments.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    campusCode: d.campus.code,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight">Administrative Approval Queue</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Review faculty research submissions requiring institutional verification. Approve, reject, or request revisions with mandatory compliance comments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-center">
            <span className="block text-xs font-semibold text-amber-400 uppercase tracking-wider">Queue Total</span>
            <span className="text-xl font-extrabold text-amber-400">{publications.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <ApprovalFilters departments={formattedDepts} />

      {/* Publication Queue Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px] text-slate-500">
              <tr>
                <th className="px-4 py-3">Title & Journal</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Pub Type</th>
                <th className="px-4 py-3">Submitted Date</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {publications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm space-y-2">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="text-xs font-bold text-slate-700">No publications found matching filters</p>
                      <p className="text-[11px] text-slate-500">
                        Try adjusting your status, department, or date range filters above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                publications.map((pub) => {
                  const latestApproval = pub.approvals[0];
                  return (
                    <tr key={pub.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Journal */}
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/admin/publications/${pub.id}`}
                          className="font-bold text-slate-900 hover:text-amber-600 line-clamp-2 leading-snug"
                        >
                          {pub.title}
                        </Link>
                        {pub.journal && (
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                            Journal: {pub.journal.name}
                          </p>
                        )}
                        {pub.quartile && pub.quartile !== "UNSPECIFIED" && (
                          <span className="mt-1 inline-block rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800">
                            {pub.quartile}
                          </span>
                        )}
                      </td>

                      {/* Submitted By */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900 leading-none">
                              {pub.createdBy.name || "Faculty Submitter"}
                            </p>
                            <p className="text-[10px] text-slate-500">{pub.createdBy.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <div>
                            <span className="font-bold text-slate-900">{pub.department.code}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {pub.department.campus.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Publication Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {pub.publicationType.replace("_", " ")}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(pub.submissionDate || pub.createdAt)}</span>
                        </div>
                      </td>

                      {/* Current Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            pub.status === "APPROVED" || pub.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
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
                        {latestApproval?.comment && (
                          <p className="mt-0.5 text-[9px] text-slate-500 max-w-[140px] truncate" title={latestApproval.comment}>
                            &quot;{latestApproval.comment}&quot;
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right space-y-1">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/publications/${pub.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Review</span>
                          </Link>

                          <ApprovalActionsModal
                            publicationId={pub.id}
                            title={pub.title}
                            currentStatus={pub.status}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
