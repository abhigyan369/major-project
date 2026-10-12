"use client";

import React from "react";
import { Edit, Trash2, Power, Users, BookOpen, Target, Building } from "lucide-react";

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  campusId: string;
  facultyCount: number;
  targetPerFaculty: number;
  isActive: boolean;
  campus: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    users: number;
    publications: number;
  };
}

interface DepartmentTableProps {
  departments: DepartmentItem[];
  onEdit: (dept: DepartmentItem) => void;
  onToggleStatus: (dept: DepartmentItem) => void;
  onDelete: (dept: DepartmentItem) => void;
}

export function DepartmentTable({
  departments,
  onEdit,
  onToggleStatus,
  onDelete,
}: DepartmentTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider font-bold text-[10px] text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3.5">Code & Name</th>
              <th scope="col" className="px-4 py-3.5">Campus</th>
              <th scope="col" className="px-4 py-3.5 text-center">Faculty Count</th>
              <th scope="col" className="px-4 py-3.5 text-center">Pub Target</th>
              <th scope="col" className="px-4 py-3.5 text-center">Assigned Users</th>
              <th scope="col" className="px-4 py-3.5 text-center">Total Pubs</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  No departments found matching the criteria.
                </td>
              </tr>
            ) : (
              departments.map((dept) => {
                const annualTarget = Math.round(dept.facultyCount * dept.targetPerFaculty);
                return (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code & Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-black text-amber-400 text-xs">
                          {dept.code}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{dept.name}</span>
                          <span className="text-[10px] text-slate-400">Code: {dept.code}</span>
                        </div>
                      </div>
                    </td>

                    {/* Campus */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {dept.campus.name}
                      </span>
                    </td>

                    {/* Faculty Count */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-800 text-sm">
                      {dept.facultyCount}
                    </td>

                    {/* Annual Target */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-amber-700 text-sm flex items-center gap-1">
                          <Target className="h-3.5 w-3.5 text-amber-500" />
                          {annualTarget} papers
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({dept.targetPerFaculty} / faculty)
                        </span>
                      </div>
                    </td>

                    {/* Assigned Users */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {dept._count.users}
                      </span>
                    </td>

                    {/* Total Pubs */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs border border-blue-200/60">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        {dept._count.publications}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      {dept.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEdit(dept)}
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Department Details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => onToggleStatus(dept)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            dept.isActive
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-slate-400 hover:bg-slate-100"
                          }`}
                          title={dept.isActive ? "Deactivate Department" : "Activate Department"}
                        >
                          <Power className="h-4 w-4" />
                        </button>

                        {/* Delete / Migration Button */}
                        <button
                          onClick={() => onDelete(dept)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Department (Safe Migration)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
