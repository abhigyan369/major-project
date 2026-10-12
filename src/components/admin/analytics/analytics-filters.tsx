"use client";

import React from "react";
import {
  Filter,
  RotateCcw,
  Calendar,
  Building2,
  Users,
  BookOpen,
  CheckCircle2,
  Award,
  Shield,
  HelpCircle,
  Sliders,
} from "lucide-react";

export interface AnalyticsFiltersState {
  year: string;
  startDate: string;
  endDate: string;
  campusId: string;
  departmentId: string;
  facultyId: string;
  publicationType: string;
  status: string;
  scopusQuartile: string;
  webOfScience: string;
  targetPerFaculty: number;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState;
  onFilterChange: (key: keyof AnalyticsFiltersState, value: string | number) => void;
  onReset: () => void;
  options: {
    years: string[];
    campuses: { id: string; code: string; name: string }[];
    departments: { id: string; code: string; name: string }[];
    faculty: { id: string; name: string; email: string }[];
  };
  onOpenRules: () => void;
}

export function AnalyticsFilters({
  filters,
  onFilterChange,
  onReset,
  options,
  onOpenRules,
}: AnalyticsFiltersProps) {
  const isFiltered =
    filters.year !== "ALL" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.campusId !== "ALL" ||
    filters.departmentId !== "ALL" ||
    filters.facultyId !== "ALL" ||
    filters.publicationType !== "ALL" ||
    filters.status !== "ALL" ||
    filters.scopusQuartile !== "ALL" ||
    filters.webOfScience !== "ALL" ||
    filters.targetPerFaculty !== 3.0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
            <Filter className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">
            Global Analytics Filters
          </h2>
          {isFiltered && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Active Filters
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Target Per Faculty Multiplier Configurator */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 border border-slate-200 text-xs">
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Target/Faculty:</span>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={filters.targetPerFaculty}
              onChange={(e) =>
                onFilterChange("targetPerFaculty", parseFloat(e.target.value) || 3.0)
              }
              className="w-14 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-center text-xs font-bold text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-amber-600 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>KPI Definitions</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-2xs hover:bg-amber-100 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Year */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Publication Year</span>
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange("year", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Available Years</option>
            {options.years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Date Range: Start */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Start Date</span>
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* 3. Date Range: End */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>End Date</span>
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* 4. Campus */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span>Campus</span>
          </label>
          <select
            value={filters.campusId}
            onChange={(e) => onFilterChange("campusId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Campuses (South & North)</option>
            {options.campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Department */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            <span>Department</span>
          </label>
          <select
            value={filters.departmentId}
            onChange={(e) => onFilterChange("departmentId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All 10 Departments</option>
            {options.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Faculty */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Users className="h-3 w-3 text-slate-400" />
            <span>Faculty Member</span>
          </label>
          <select
            value={filters.facultyId}
            onChange={(e) => onFilterChange("facultyId", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Faculty Authors</option>
            {options.faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.email})
              </option>
            ))}
          </select>
        </div>

        {/* 7. Publication Type */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-slate-400" />
            <span>Publication Type</span>
          </label>
          <select
            value={filters.publicationType}
            onChange={(e) => onFilterChange("publicationType", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
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

        {/* 8. Status */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-slate-400" />
            <span>Publication Status</span>
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Workflow Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="APPROVED">Approved</option>
            <option value="SUBMITTED">Submitted (Pending)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {/* 9. Scopus Quartile */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Award className="h-3 w-3 text-slate-400" />
            <span>Scopus Quartile</span>
          </label>
          <select
            value={filters.scopusQuartile}
            onChange={(e) => onFilterChange("scopusQuartile", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Quartiles</option>
            <option value="Q1">Q1 Top Tier</option>
            <option value="Q2">Q2 High Quality</option>
            <option value="Q3">Q3 Mid Tier</option>
            <option value="Q4">Q4 Standard Tier</option>
            <option value="UNSPECIFIED">Unspecified</option>
            <option value="NOT_SCOPUS">Not Scopus</option>
          </select>
        </div>

        {/* 10. Web of Science */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-slate-400" />
            <span>Web of Science Indexing</span>
          </label>
          <select
            value={filters.webOfScience}
            onChange={(e) => onFilterChange("webOfScience", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Publications</option>
            <option value="INDEXED">WoS Indexed Only</option>
            <option value="NON_INDEXED">Non-WoS Publications</option>
          </select>
        </div>
      </div>
    </div>
  );
}
