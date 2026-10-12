"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
  campusCode?: string;
}

interface ApprovalFiltersProps {
  departments: DepartmentOption[];
}

export function ApprovalFilters({ departments }: ApprovalFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDepartment = searchParams.get("department") || "";
  const currentCampus = searchParams.get("campus") || "";
  const currentPubType = searchParams.get("publicationType") || "";
  const currentStatus = searchParams.get("status") || "SUBMITTED"; // Default queue to SUBMITTED
  const currentDateFrom = searchParams.get("dateFrom") || "";
  const currentDateTo = searchParams.get("dateTo") || "";
  const currentFaculty = searchParams.get("faculty") || "";
  const currentQuartile = searchParams.get("quartile") || "";

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-amber-500" />
          <span>Approval Queue Filter Controls</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Status Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
          <select
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Department</label>
          <select
            value={currentDepartment}
            onChange={(e) => updateFilters({ department: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campus Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Campus</label>
          <select
            value={currentCampus}
            onChange={(e) => updateFilters({ campus: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Campuses</option>
            <option value="SOUTH">South Campus</option>
            <option value="NORTH">North Campus</option>
          </select>
        </div>

        {/* Publication Type Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Publication Type</label>
          <select
            value={currentPubType}
            onChange={(e) => updateFilters({ publicationType: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="JOURNAL_ARTICLE">Journal Article</option>
            <option value="CONFERENCE_PAPER">Conference Paper</option>
            <option value="BOOK_CHAPTER">Book Chapter</option>
            <option value="REVIEW_ARTICLE">Review Article</option>
            <option value="PATENT">Patent</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Faculty Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Faculty / Submitter</label>
          <div className="relative">
            <input
              type="text"
              value={currentFaculty}
              onChange={(e) => updateFilters({ faculty: e.target.value })}
              placeholder="Search faculty name/email..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Quartile Filter */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Scopus Quartile</label>
          <select
            value={currentQuartile}
            onChange={(e) => updateFilters({ quartile: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Quartiles</option>
            <option value="Q1">Q1 (Top 25%)</option>
            <option value="Q2">Q2 (25-50%)</option>
            <option value="Q3">Q3 (50-75%)</option>
            <option value="Q4">Q4 (Bottom 25%)</option>
            <option value="UNSPECIFIED">Unspecified</option>
            <option value="NOT_SCOPUS">Not Scopus</option>
          </select>
        </div>

        {/* Submission Date From */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Submitted Date From</label>
          <input
            type="date"
            value={currentDateFrom}
            onChange={(e) => updateFilters({ dateFrom: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Submission Date To */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Submitted Date To</label>
          <input
            type="date"
            value={currentDateTo}
            onChange={(e) => updateFilters({ dateTo: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
