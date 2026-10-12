import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import {
  BookOpen,
  FileEdit,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Bell,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  XCircle,
  Eye,
  Edit,
} from "lucide-react";

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { error } = await searchParams;
  const user = session.user;

  // Query user-owned publications strictly (Ownership Boundary) from PostgreSQL
  const userPublications = await db.publication.findMany({
    where: { createdById: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      department: true,
      journal: true,
      approvals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Calculate status counts strictly from PostgreSQL records
  const totalCount = userPublications.length;
  const draftCount = userPublications.filter((p) => p.status === "DRAFT").length;
  const pendingCount = userPublications.filter((p) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)
  ).length;
  const approvedCount = userPublications.filter((p) => p.status === "APPROVED").length;
  const publishedCount = userPublications.filter((p) => p.status === "PUBLISHED").length;
  const revisionCount = userPublications.filter((p) => p.status === "REVISION_REQUIRED").length;
  const rejectedCount = userPublications.filter((p) => p.status === "REJECTED").length;

  // Fetch recent notifications for user
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      {/* Forbidden Warning Banner */}
      {error === "forbidden_admin_access" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="font-semibold">Access Restricted</p>
            <p className="text-xs text-red-300/80">
              You do not have Administrator permissions to access that route.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight">
              Welcome back, {user.name || "Faculty Member"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Track your research manuscripts, monitor submission statuses, respond to admin reviews, and upload supporting documents.
          </p>
        </div>

        <Link
          href="/user/publications/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:bg-amber-400 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Research Submission</span>
        </Link>
      </div>

      {/* KPI Stats Cards — All 7 Required Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total Publications */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Total</span>
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-slate-900">{totalCount}</p>
          <p className="text-[10px] text-slate-400">All submissions</p>
        </div>

        {/* 2. Draft Publications */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Drafts</span>
            <FileEdit className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-amber-600">{draftCount}</p>
          <p className="text-[10px] text-slate-400">In preparation</p>
        </div>

        {/* 3. Pending Approval */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Pending</span>
            <Clock className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-blue-600">{pendingCount}</p>
          <p className="text-[10px] text-slate-400">In admin queue</p>
        </div>

        {/* 4. Approved */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Approved</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-[10px] text-slate-400">Verified papers</p>
        </div>

        {/* 5. Published */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Published</span>
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-purple-600">{publishedCount}</p>
          <p className="text-[10px] text-slate-400">Final publications</p>
        </div>

        {/* 6. Revision Required */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Revision Req.</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-amber-700">{revisionCount}</p>
          <p className="text-[10px] text-slate-400">Requires edits</p>
        </div>

        {/* 7. Rejected */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
            <span>Rejected</span>
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          </div>
          <p className="mt-1.5 text-xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-[10px] text-slate-400">Declined papers</p>
        </div>
      </div>

      {/* Main Table: Recent Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Publications Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span>Recent Publications Table</span>
            </h2>
            <Link
              href="/user/publications"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All ({totalCount})</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {userPublications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-xs font-semibold text-slate-700">No publications found in PostgreSQL database</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Get started by submitting your latest journal paper or conference article.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-3 py-3">Publication Type</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Submitted Date</th>
                    <th className="px-3 py-3">Updated Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userPublications.slice(0, 10).map((pub) => {
                    const isEditable = pub.status === "DRAFT" || pub.status === "REVISION_REQUIRED";
                    return (
                      <tr key={pub.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Title */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="font-bold text-slate-900 truncate" title={pub.title}>
                            {pub.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {pub.journal?.name || pub.venueName || "NIE Mysore"}
                          </p>
                        </td>

                        {/* Publication Type */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {pub.publicationType.replace("_", " ")}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {pub.department.code}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
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
                        </td>

                        {/* Submitted Date */}
                        <td className="px-3 py-3 whitespace-nowrap text-[11px] text-slate-500">
                          {pub.submissionDate
                            ? new Date(pub.submissionDate).toLocaleDateString("en-IN")
                            : "—"}
                        </td>

                        {/* Updated Date */}
                        <td className="px-3 py-3 whitespace-nowrap text-[11px] text-slate-500">
                          {new Date(pub.updatedAt).toLocaleDateString("en-IN")}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/user/publications/${pub.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Link>

                            {isEditable && (
                              <Link
                                href={`/user/publications/${pub.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400"
                                title="Edit & Resubmit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: System Notifications */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <span>Recent Notifications</span>
          </h2>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 leading-snug">
                    {notif.message}
                  </p>
                  <span className="mt-1 block text-[9px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
