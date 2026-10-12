"use client";

import React, { useState } from "react";
import { Users, Search } from "lucide-react";

export interface FacultyPerformanceItem {
  id: string;
  name: string;
  email: string;
  departmentCode: string;
  publicationCount: number;
  q1Count: number;
  q2Count: number;
  wosCount: number;
  totalCitations: number;
}

interface FacultyPerformanceTableProps {
  facultyList: FacultyPerformanceItem[];
}

export function FacultyPerformanceTable({ facultyList }: FacultyPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredList = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.departmentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Faculty Research Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Individual contribution breakdown for active faculty authors.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty name, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Faculty Member</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Publications</th>
              <th className="px-4 py-3 text-right">Q1 Count</th>
              <th className="px-4 py-3 text-right">Q2 Count</th>
              <th className="px-4 py-3 text-right">WoS Count</th>
              <th className="px-4 py-3 text-right">Total Citations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No faculty records found matching current query.
                </td>
              </tr>
            ) : (
              filteredList.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{faculty.name}</span>
                      <span className="text-[10px] text-slate-400">{faculty.email}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {faculty.departmentCode}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {faculty.publicationCount}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-indigo-600 font-semibold">
                    {faculty.q1Count}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-purple-600 font-semibold">
                    {faculty.q2Count}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-cyan-600 font-semibold">
                    {faculty.wosCount}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-amber-600 font-bold">
                    {faculty.totalCitations}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
