import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminDepartments } from "@/server/services/department.service";
import { DepartmentsClientWrapper } from "@/components/admin/departments/departments-client-wrapper";
import { DepartmentItem } from "@/components/admin/departments/department-table";
import { Building2, Users, Target, BookOpen } from "lucide-react";

interface AdminDepartmentsPageProps {
  searchParams: Promise<{
    search?: string;
    campusId?: string;
  }>;
}

export default async function AdminDepartmentsPage({ searchParams }: AdminDepartmentsPageProps) {
  await requireAdmin();

  const params = await searchParams;

  const {
    departments,
    campuses,
    stats,
  } = await getAdminDepartments({
    search: params.search,
    campusId: params.campusId,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <Building2 className="h-6 w-6 text-amber-500" />
            <span>Department & Campus Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage NIE academic departments, campus allocations, faculty counts, and annual NIRF publication targets.
          </p>
        </div>
      </div>

      {/* KPI Stats Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Departments</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalDepartments}</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Total Faculty</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">{stats.totalFaculty}</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Annual Target</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950">{stats.totalAnnualTarget} papers</span>
            <Target className="h-4 w-4 text-amber-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">Total Publications</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-900">{stats.totalPubsCount}</span>
            <BookOpen className="h-4 w-4 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Client Interactive Wrapper */}
      <DepartmentsClientWrapper
        departments={departments as unknown as DepartmentItem[]}
        campuses={campuses}
      />
    </div>
  );
}
