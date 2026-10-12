import React from "react";
import { getPublicationStats } from "@/server/services/publication.service";
import { getAllDepartments } from "@/server/services/department.service";
import { StatCard } from "@/components/shared/stat-card";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Building2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Fresh server-side data fetching

export default async function DashboardPage() {
  const stats = await getPublicationStats();
  const departments = await getAllDepartments();

  const totalFacultyCount = departments.reduce(
    (acc, dept) => acc + dept.facultyCount,
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-amber-400">
              Phase 1 Institutional Shell
            </span>
            <span className="text-xs text-slate-500">
              PostgreSQL Connected
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Executive Research Portal Overview
          </h1>
          <p className="text-xs text-slate-500">
            Tracking research output, NIRF benchmarks, Scopus quartiles, and department performance across NIE Mysore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/publications"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-slate-500" />
            <span>View All Papers</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Publications"
          value={stats.totalCount}
          description="Total active publication records in tracker"
          iconName="FileText"
          change={`${stats.publishedCount} Published`}
          changeType="positive"
        />
        <StatCard
          title="NIRF Q1 & Q2 Ratio"
          value={stats.q1Q2Count}
          description="High-priority WoS / Scopus indexed journals"
          iconName="Award"
          change="Target: 60%+"
          changeType="positive"
        />
        <StatCard
          title="Active Review Pipeline"
          value={stats.pipelineCount}
          description="Manuscripts submitted & under peer review"
          iconName="Clock"
          change={`${stats.acceptedCount} Accepted`}
          changeType="neutral"
        />
        <StatCard
          title="Active Faculty Base"
          value={totalFacultyCount}
          description="Total full-time faculty across 10 departments"
          iconName="TrendingUp"
          change="10 Departments"
          changeType="positive"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Department Performance Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-700" />
              <span>Departmental Faculty Strength & Targets</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              10 Departments
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Department Name</th>
                    <th className="px-4 py-3">Campus</th>
                    <th className="px-4 py-3 text-right">Faculty</th>
                    <th className="px-4 py-3 text-right">Target Papers</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {departments.map((dept) => {
                    const targetPapers = Math.round(dept.facultyCount * dept.targetPerFaculty);
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200">
                            {dept.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">{dept.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {dept.campus?.name || dept.campus?.code || "South"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {dept.facultyCount}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 font-mono">
                          {targetPapers}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: System Status & Migration Notice */}
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Award className="h-4 w-4 text-amber-700" />
              <span>Phase 1 System Verification</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              The Next.js App Router foundation, PostgreSQL database on port 5433, Prisma schema, and institutional layout are operational.
            </p>
            <div className="pt-2 border-t border-amber-200/80 text-[11px] text-amber-900 font-mono space-y-1">
              <div>• Next.js App Router: Active</div>
              <div>• Database: PostgreSQL 17</div>
              <div>• ORM: Prisma 6.x</div>
              <div>• Seeded Departments: 10/10</div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/publications"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span>Publications Directory</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Link>
              <Link
                href="/analytics"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span>Analytics & NIRF Reports</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
