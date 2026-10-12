"use client";

import React from "react";
import { Building2, MousePointerClick } from "lucide-react";

export interface DepartmentScorecardItem {
  id: string;
  code: string;
  name: string;
  campusName: string;
  facultyCount: number;
  target: number;
  published: number;
  approved: number;
  totalUnderFilter: number;
  q1: number;
  q2: number;
  wos: number;
  achievementPct: number;
}

interface DepartmentScorecardProps {
  scorecard: DepartmentScorecardItem[];
  selectedDeptId: string;
  onSelectDept: (deptId: string) => void;
}

export function DepartmentScorecard({
  scorecard,
  selectedDeptId,
  onSelectDept,
}: DepartmentScorecardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Department Performance Scorecard
            </h2>
            <p className="text-xs text-slate-500">
              Comparative benchmark matrix across all NIE academic departments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono">
          <MousePointerClick className="h-3.5 w-3.5 text-amber-500" />
          <span>Click row to filter faculty breakdown</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Campus</th>
              <th className="px-4 py-3 text-right">Faculty Count</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Published</th>
              <th className="px-4 py-3 text-right">Q1</th>
              <th className="px-4 py-3 text-right">Q2</th>
              <th className="px-4 py-3 text-right">WoS</th>
              <th className="px-4 py-3 text-center">Achievement %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {scorecard.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No departments found matching current filters.
                </td>
              </tr>
            ) : (
              scorecard.map((dept) => {
                const isSelected = selectedDeptId === dept.id;

                let achievementBadge = "bg-rose-50 text-rose-700 border-rose-200";
                if (dept.achievementPct >= 100) {
                  achievementBadge = "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
                } else if (dept.achievementPct >= 50) {
                  achievementBadge = "bg-amber-100 text-amber-800 border-amber-300";
                }

                return (
                  <tr
                    key={dept.id}
                    onClick={() => onSelectDept(isSelected ? "ALL" : dept.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-amber-500/10 font-semibold border-l-4 border-l-amber-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono">
                          {dept.code}
                        </span>
                        <span className="text-slate-800 hidden sm:inline">{dept.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {dept.campusName}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {dept.facultyCount}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {dept.target}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {dept.published}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-indigo-600">
                      {dept.q1}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-purple-600">
                      {dept.q2}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-cyan-600">
                      {dept.wos}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border font-mono ${achievementBadge}`}
                      >
                        {dept.achievementPct}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
