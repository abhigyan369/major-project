import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminPublications } from "@/server/services/publication.service";
import { AdminPublicationFilters } from "@/components/admin/publications/admin-publication-filters";
import { AdminPublicationTable } from "@/components/admin/publications/admin-publication-table";
import Link from "next/link";
import { BookOpen, ShieldCheck, CheckCircle2, Clock, FileCheck2, Archive } from "lucide-react";

interface AdminPublicationsPageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    campusId?: string;
    facultyId?: string;
    status?: string;
    quartile?: string;
    publicationType?: string;
    year?: string;
    isWebOfScience?: string;
    isScopus?: string;
    sortBy?: "createdAt" | "publicationDate" | "title" | "impactFactor" | "citationCount";
    sortOrder?: "asc" | "desc";
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminPublicationsPage({ searchParams }: AdminPublicationsPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);

  const {
    data: publications,
    totalCount,
    page: currentPage,
    totalPages,
    filterOptions,
    stats,
  } = await getAdminPublications({
    search: params.search,
    departmentId: params.departmentId,
    campusId: params.campusId,
    facultyId: params.facultyId,
    status: params.status,
    quartile: params.quartile,
    publicationType: params.publicationType,
    year: params.year,
    isWebOfScience: params.isWebOfScience,
    isScopus: params.isScopus,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    page,
    limit,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <BookOpen className="h-6 w-6 text-amber-500" />
            <span>Master Institutional Publications Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete institutional archive, lifecycle management, and audit trail for all NIE research publications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/approvals"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Pending Approvals Queue</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Submissions</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalPubs}</span>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Pending Review</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">{stats.submittedPubs}</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Approved Records</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{stats.approvedPubs}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">Published Articles</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-900">{stats.publishedPubs}</span>
            <FileCheck2 className="h-4 w-4 text-teal-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Archived Records</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{stats.archivedPubs}</span>
            <Archive className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Filter Controls Component */}
      <AdminPublicationFilters
        departments={filterOptions.departments}
        campuses={filterOptions.campuses}
        faculties={filterOptions.faculties}
        totalResults={totalCount}
      />

      {/* Publications Table Component */}
      <AdminPublicationTable
        publications={publications}
        departments={filterOptions.departments}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
      />
    </div>
  );
}
