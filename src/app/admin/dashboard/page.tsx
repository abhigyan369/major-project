import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import db from "@/lib/db";
import Link from "next/link";
import {
  Shield,
  BookOpen,
  Clock,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  ArrowUpRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  // Query all system publications for Admin Dashboard
  const allPublications = await db.publication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      journal: true,
      createdBy: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const pendingApprovals = allPublications.filter((p) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)
  );
  const pendingCount = pendingApprovals.length;
  const approvedCount = allPublications.filter((p) =>
    ["APPROVED", "PUBLISHED"].includes(p.status)
  ).length;

  const totalUsers = await db.user.count();
  const totalDepartments = await db.department.count();

  // Audit Logs
  const recentAuditLogs = await db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight">
              Institutional Admin Dashboard
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Logged in as <span className="text-amber-400 font-semibold">{admin.email}</span>. Review pending approvals, monitor NIRF targets across 10 departments, and enforce research compliance.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/approvals"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all"
          >
            <Shield className="h-4 w-4" />
            <span>Approval Queue ({pendingCount})</span>
          </Link>
          <Link
            href="/admin/publications"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 shadow hover:bg-slate-700 transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span>All Publications</span>
          </Link>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Approvals</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-slate-500">Requires Admin Action</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Approved / Published</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-[10px] text-slate-500">Official Repository</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Faculty Users</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalUsers}</p>
          <p className="text-[10px] text-slate-500">Active Academic Staff</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Departments</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalDepartments}</p>
          <p className="text-[10px] text-slate-500">NIE Campuses</p>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Approvals Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Pending Review Queue ({pendingCount})</span>
            </h2>
            <Link
              href="/admin/publications"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All Papers</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-xs font-semibold text-slate-700">All submissions reviewed</p>
              <p className="mt-1 text-[11px] text-slate-500">
                No pending publication approvals requiring admin intervention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((pub) => (
                <div
                  key={pub.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        {pub.department.code} • {pub.publicationType}
                      </span>
                      <h3 className="mt-1 text-xs font-bold text-slate-900">{pub.title}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        Author: <span className="font-semibold">{pub.createdBy.name || pub.createdBy.email}</span>
                      </p>
                    </div>

                    <Link
                      href={`/admin/publications/${pub.id}`}
                      className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 shadow hover:bg-amber-400"
                    >
                      Review Paper
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Audit Trail */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Audit Trail Log</span>
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString("en-IN")}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  User: {log.user?.email || "System"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
