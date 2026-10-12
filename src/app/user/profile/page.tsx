import React from "react";
import { requireAuth } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { UserProfileForm } from "@/components/profile/user-profile-form";
import { User, BookOpen, CheckCircle2, Clock, FileEdit } from "lucide-react";


export default async function UserProfilePage() {
  const sessionUser = await requireAuth();

  // Fetch full user record from PostgreSQL DB
  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      department: {
        include: {
          campus: true,
        },
      },
      publicationsCreated: true,
    },
  });

  if (!user) {
    return null;
  }

  const departments = await db.department.findMany({
    orderBy: { code: "asc" },
  });

  const totalPubs = user.publicationsCreated.length;
  const approvedPubs = user.publicationsCreated.filter((p) =>
    ["APPROVED", "PUBLISHED"].includes(p.status)
  ).length;
  const pendingPubs = user.publicationsCreated.filter((p) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(p.status)
  ).length;
  const draftPubs = user.publicationsCreated.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-5 w-5 text-amber-500" />
          <span>Faculty Profile & Institutional Account</span>
        </h1>
        <p className="text-xs text-slate-500">
          Manage your faculty details, academic designation, department affiliation, and view research contribution stats.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 font-bold text-slate-950 text-xl shadow-lg ring-4 ring-amber-500/20">
            {(user.name || user.email || "F")[0].toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{user.name || "Faculty Member"}</h2>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-[11px] text-amber-400 font-medium">
              {user.designation ? user.designation.replace("_", " ") : "Faculty Member"} •{" "}
              {user.department ? user.department.name : "Unassigned Department"}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 rounded-xl bg-slate-950/60 p-4 border border-slate-800 text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Total Publications</p>
            <p className="text-base font-bold text-amber-400">{totalPubs}</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-[10px] text-slate-400">NIRF Approved</p>
            <p className="text-base font-bold text-emerald-400">{approvedPubs}</p>
          </div>
        </div>
      </div>

      {/* Publications Statistics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Papers</span>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalPubs}</p>
          <p className="text-[10px] text-slate-400">Institutional record</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{approvedPubs}</p>
          <p className="text-[10px] text-slate-400">NIRF compliant</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{pendingPubs}</p>
          <p className="text-[10px] text-slate-400">In approval queue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Drafts</span>
            <FileEdit className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{draftPubs}</p>
          <p className="text-[10px] text-slate-400">Work in progress</p>
        </div>
      </div>

      {/* Profile Update Form */}
      <UserProfileForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          designation: user.designation,
          departmentId: user.departmentId,
          department: user.department,
        }}
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
      />
    </div>
  );
}
