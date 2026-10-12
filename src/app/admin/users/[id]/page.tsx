import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getUserDetailsById } from "@/server/services/user-admin.service";
import {
  User,
  Building,
  Shield,
  BookOpen,
  CheckCircle2,
  Award,
  FileCheck2,
  ChevronLeft,
  Calendar,
  History,
  ExternalLink,
} from "lucide-react";
import { UserRole, UserStatus, FacultyDesignation } from "@prisma/client";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const result = await getUserDetailsById(id);

  if (!result || !result.user) {
    notFound();
  }

  const { user, stats } = result;

  function formatDesignation(designation: FacultyDesignation | null) {
    if (!designation) return "Unassigned Designation";
    switch (designation) {
      case "PROFESSOR":
        return "Professor";
      case "ASSOCIATE_PROFESSOR":
        return "Associate Professor";
      case "ASSISTANT_PROFESSOR":
        return "Assistant Professor";
      case "CONTRACT_FACULTY":
        return "Contract Faculty";
      case "RESEARCH_SCHOLAR":
        return "Research Scholar";
      default:
        return "Other";
    }
  }

  const publications = user.publicationsCreated || [];
  const auditLogs = user.auditLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/admin/users" className="flex items-center gap-1 hover:text-amber-600 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Users List</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{user.name || user.email}</span>
      </div>

      {/* User Header Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500 font-black text-slate-950 text-2xl shadow-md">
            {user.name ? user.name.charAt(0) : "U"}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{user.name || "Unnamed User"}</h1>
              {user.role === UserRole.ADMIN ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  ADMINISTRATOR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                  FACULTY USER
                </span>
              )}

              {user.status === UserStatus.ACTIVE && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ACTIVE
                </span>
              )}
              {user.status === UserStatus.INACTIVE && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                  INACTIVE
                </span>
              )}
              {user.status === UserStatus.SUSPENDED && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                  SUSPENDED
                </span>
              )}
            </div>

            <p className="text-xs font-mono text-slate-600">{user.email}</p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">
                  {user.department ? `${user.department.code} - ${user.department.name}` : "Unassigned Department"}
                </span>
              </div>
              <div>•</div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{formatDesignation(user.designation)}</span>
              </div>
              <div>•</div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            Manage User List
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Authored Pubs</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats.totalPublications}</span>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Approved / Published</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-900">{stats.approvedOrPublished}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Scopus Indexed</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-900">{stats.scopusCount}</span>
            <Award className="h-4 w-4 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Web of Science</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950">{stats.wosCount}</span>
            <FileCheck2 className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Publications Repository Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" />
            <span>Authored Publications ({publications.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px] text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Title & Type</th>
                <th scope="col" className="px-4 py-3">Journal / Venue</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Created Date</th>
                <th scope="col" className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {publications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No publications authored or submitted by this user yet.
                  </td>
                </tr>
              ) : (
                publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">
                      {pub.title}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Type: {pub.publicationType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {pub.journal?.name || pub.venueName || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                        {pub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {new Date(pub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/publications?search=${encodeURIComponent(pub.title)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Activity & Audit History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <span>Audit Log Activity History</span>
          </h2>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent audit log activity for this user.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-slate-900 text-amber-400 font-mono text-[10px] font-bold px-2 py-1">
                    {log.action}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">{log.entityType}</span>
                    {log.entityId && (
                      <span className="text-[10px] text-slate-400 font-mono ml-2">ID: {log.entityId.slice(-6)}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
