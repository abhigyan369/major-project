"use client";

import React from "react";
import { Filter, Calendar, Building2, User, BookOpen, Layers, RefreshCw, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  years: string[];
  departments: Array<{ id: string; code: string; name: string }>;
  campuses: Array<{ id: string; code: string; name: string }>;
  faculty: Array<{ id: string; name: string; email: string }>;
}

export interface ReportFilterState {
  reportType: "PUBLICATIONS" | "DEPT_PERFORMANCE" | "FACULTY_PERFORMANCE";
  year: string;
  quarter: string;
  startDate: string;
  endDate: string;
  departmentId: string;
  campusId: string;
  facultyId: string;
  publicationType: string;
  status: string;
  scopusQuartile: string;
  webOfScience: string;
  search: string;
}

interface CustomReportFiltersProps {
  filters: ReportFilterState;
  onChangeFilter: (key: keyof ReportFilterState, value: string) => void;
  onResetFilters: () => void;
  options: FilterOptions;
  onGeneratePreview: () => void;
  isLoadingPreview: boolean;
}

export function CustomReportFilters({
  filters,
  onChangeFilter,
  onResetFilters,
  options,
  onGeneratePreview,
  isLoadingPreview,
}: CustomReportFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Custom Report Filter Configuration
            </h3>
            <p className="text-[11px] text-slate-500">Fine-tune parameters to export targeted datasets</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            type="button"
            onClick={onGeneratePreview}
            disabled={isLoadingPreview}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isLoadingPreview ? "Generating Preview..." : "Apply & Preview"}</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Report Dataset Category</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChangeFilter("reportType", "PUBLICATIONS")}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-left",
              filters.reportType === "PUBLICATIONS"
                ? "border-amber-500 bg-amber-50/50 text-amber-900 shadow-sm ring-1 ring-amber-500"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <BookOpen className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="block font-bold">Filtered Publications</span>
              <span className="text-[10px] text-slate-500 font-normal">Individual publication rows with full details</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter("reportType", "DEPT_PERFORMANCE")}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-left",
              filters.reportType === "DEPT_PERFORMANCE"
                ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm ring-1 ring-blue-500"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <span className="block font-bold">Department Scorecards</span>
              <span className="text-[10px] text-slate-500 font-normal">Department target vs actual NIRF metrics</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter("reportType", "FACULTY_PERFORMANCE")}
            className={cn(
              "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all text-left",
              filters.reportType === "FACULTY_PERFORMANCE"
                ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 shadow-sm ring-1 ring-indigo-500"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
            )}
          >
            <User className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <span className="block font-bold">Faculty Matrix</span>
              <span className="text-[10px] text-slate-500 font-normal">Faculty member research output & citations</span>
            </div>
          </button>
        </div>
      </div>

      {/* Grid of Dynamic Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        {/* Search Keyword */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Search className="h-3 w-3 text-slate-400" />
            <span>Search Title / DOI / Venue / Author</span>
          </label>
          <input
            type="text"
            placeholder="Search keywords..."
            value={filters.search}
            onChange={(e) => onChangeFilter("search", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Year Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Publication Year</span>
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChangeFilter("year", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Available Years</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quarter Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Layers className="h-3 w-3 text-slate-400" />
            <span>Calendar Quarter</span>
          </label>
          <select
            value={filters.quarter}
            onChange={(e) => onChangeFilter("quarter", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Quarters</option>
            <option value="Q1">Q1 (Jan - Mar)</option>
            <option value="Q2">Q2 (Apr - Jun)</option>
            <option value="Q3">Q3 (Jul - Sep)</option>
            <option value="Q4">Q4 (Oct - Dec)</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span>Department</span>
          </label>
          <select
            value={filters.departmentId}
            onChange={(e) => onChangeFilter("departmentId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {options.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campus Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span>Campus</span>
          </label>
          <select
            value={filters.campusId}
            onChange={(e) => onChangeFilter("campusId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Campuses</option>
            {options.campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Faculty / Author Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <User className="h-3 w-3 text-slate-400" />
            <span>Faculty Member</span>
          </label>
          <select
            value={filters.facultyId}
            onChange={(e) => onChangeFilter("facultyId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Faculty Members</option>
            {options.faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.email})
              </option>
            ))}
          </select>
        </div>

        {/* Publication Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Publication Status</label>
          <select
            value={filters.status}
            onChange={(e) => onChangeFilter("status", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted / Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {/* Scopus Quartile */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Scopus Quartile</label>
          <select
            value={filters.scopusQuartile}
            onChange={(e) => onChangeFilter("scopusQuartile", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Quartiles</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
            <option value="UNSPECIFIED">Unspecified</option>
            <option value="NOT_SCOPUS">Not Scopus</option>
          </select>
        </div>

        {/* Web of Science */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Web of Science</label>
          <select
            value={filters.webOfScience}
            onChange={(e) => onChangeFilter("webOfScience", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Records</option>
            <option value="INDEXED">WoS Indexed Only</option>
            <option value="NON_INDEXED">Non-WoS</option>
          </select>
        </div>

        {/* Publication Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Publication Type</label>
          <select
            value={filters.publicationType}
            onChange={(e) => onChangeFilter("publicationType", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Publication Types</option>
            <option value="JOURNAL_ARTICLE">Journal Article</option>
            <option value="CONFERENCE_PAPER">Conference Paper</option>
            <option value="BOOK_CHAPTER">Book Chapter</option>
            <option value="REVIEW_ARTICLE">Review Article</option>
            <option value="PATENT">Patent</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Custom Start & End Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onChangeFilter("startDate", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChangeFilter("endDate", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
