import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUsers } from "@/server/services/user-admin.service";
import { UsersClientWrapper } from "@/components/admin/users/users-client-wrapper";
import { UserItem } from "@/components/admin/users/user-table";
import { Users, UserCheck, Shield, UserX } from "lucide-react";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    departmentId?: string;
    role?: string;
    status?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);

  const {
    users,
    totalCount,
    page: currentPage,
    totalPages,
    departments,
    stats,
  } = await getAdminUsers({
    search: params.search,
    departmentId: params.departmentId,
    role: params.role,
    status: params.status,
    page,
    limit,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <Users className="h-6 w-6 text-amber-500" />
            <span>User & Faculty Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional user accounts, faculty designations, department assignments, and role authorizations.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Registered Users</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalUsers}</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Active Users</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{stats.activeUsers}</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Administrators</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950">{stats.adminUsers}</span>
            <Shield className="h-4 w-4 text-amber-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Inactive / Suspended</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{stats.inactiveUsers}</span>
            <UserX className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Client Interactive Table & Filters */}
      <UsersClientWrapper
        users={users as unknown as UserItem[]}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        departments={departments}
      />
    </div>
  );
}
