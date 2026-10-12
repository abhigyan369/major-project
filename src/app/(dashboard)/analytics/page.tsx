import React from "react";
import { getAllDepartments } from "@/server/services/department.service";
import { Award, TrendingUp, ShieldCheck } from "lucide-react";

export const revalidate = 0;

export default async function AnalyticsPage() {
  const departments = await getAllDepartments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          NIRF & Quality Analytics Engine
        </h1>
        <p className="text-xs text-slate-500">
          Executive analytics module for tracking department benchmarks, publication targets, and Scopus/WoS metrics.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Target Calculation Engine</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">3.0 Papers / Faculty</p>
          <p className="text-xs text-slate-500">
            Standard annual research target configured across all engineering departments.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>NIRF Weightage Index</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">Q1 + Q2 Filter Active</p>
          <p className="text-xs text-slate-500">
            Eliminates formula bugs present in legacy Excel files.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Department Matrix</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{departments.length} Canonical Units</p>
          <p className="text-xs text-slate-500">
            Synchronized with authoritative faculty counts from Phase 0 design.
          </p>
        </div>
      </div>

      {/* Department Metrics Breakdown Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Department Performance Target Summary
          </h2>
          <span className="text-xs text-slate-500 font-mono">Formula: Target = Faculty × 3.0</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3 text-right">Faculty Strength</th>
                <th className="px-4 py-3 text-right">Target Output</th>
                <th className="px-4 py-3 text-center">NIRF Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{dept.code}</td>
                  <td className="px-4 py-3 text-slate-800">{dept.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{dept.facultyCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {Math.round(dept.facultyCount * dept.targetPerFaculty)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Configured
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
