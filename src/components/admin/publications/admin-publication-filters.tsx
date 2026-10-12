"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RotateCcw, Search, ArrowUpDown, Layers, Building2, User, Award, BookOpen, Sparkles } from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
  campus?: {
    id: string;
    code: string;
    name: string;
  };
}

interface CampusOption {
  id: string;
  code: string;
  name: string;
}

interface FacultyOption {
  id: string;
  name: string | null;
  email: string;
  designation?: string | null;
}

interface AdminPublicationFiltersProps {
  departments: DepartmentOption[];
  campuses: CampusOption[];
  faculties: FacultyOption[];
  totalResults: number;
}

export function AdminPublicationFilters({
  departments,
  campuses,
  faculties,
  totalResults,
}: AdminPublicationFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract current search params
  const currentSearch = searchParams.get("search") || "";
  const currentDepartment = searchParams.get("departmentId") || "ALL";
  const currentCampus = searchParams.get("campusId") || "ALL";
  const currentFaculty = searchParams.get("facultyId") || "ALL";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentQuartile = searchParams.get("quartile") || "ALL";
  const currentPubType = searchParams.get("publicationType") || "ALL";
  const currentYear = searchParams.get("year") || "ALL";
  const currentWos = searchParams.get("isWebOfScience") || "ALL";
  const currentScopus = searchParams.get("isScopus") || "ALL";
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";
  const currentLimit = searchParams.get("limit") || "10";

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Keep local search input synced with URL
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 whenever filters change (unless page is explicitly updated)
    if (!("page" in updates)) {
      params.set("page", "1");
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val && val !== "ALL" && val !== "") {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleReset = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const activeFiltersCount = [
    currentSearch,
    currentDepartment !== "ALL" ? currentDepartment : null,
    currentCampus !== "ALL" ? currentCampus : null,
    currentFaculty !== "ALL" ? currentFaculty : null,
    currentStatus !== "ALL" ? currentStatus : null,
    currentQuartile !== "ALL" ? currentQuartile : null,
    currentPubType !== "ALL" ? currentPubType : null,
    currentYear !== "ALL" ? currentYear : null,
    currentWos !== "ALL" ? currentWos : null,
    currentScopus !== "ALL" ? currentScopus : null,
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Search Bar & Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search across title, author name, journal, or DOI..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/80 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{totalResults}</span> records found
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          <a
            href={`/api/admin/reports/export?search=${encodeURIComponent(currentSearch)}&departmentId=${currentDepartment}&campusId=${currentCampus}&facultyId=${currentFaculty}&status=${currentStatus}&scopusQuartile=${currentQuartile}&publicationType=${currentPubType}&year=${currentYear}&webOfScience=${currentWos}&format=EXCEL`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
            title="Export filtered publication records to Excel"
          >
            <span>Export Excel</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Primary Multi-Field Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 text-xs">
        {/* Status Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-amber-500" />
            <span>Lifecycle Status</span>
          </label>
          <select
            value={currentStatus}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED (Soft Deleted)</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-amber-500" />
            <span>Department</span>
          </label>
          <select
            value={currentDepartment}
            onChange={(e) => updateFilters({ departmentId: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Departments (10)</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} — {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campus Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-amber-500" />
            <span>Campus</span>
          </label>
          <select
            value={currentCampus}
            onChange={(e) => updateFilters({ campusId: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Faculty / Submitter Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-amber-500" />
            <span>Faculty Submitter</span>
          </label>
          <select
            value={currentFaculty}
            onChange={(e) => updateFilters({ facultyId: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Faculty Members</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || f.email} {f.designation ? `(${f.designation.replace("_", " ")})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Scopus Quartile Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-purple-500" />
            <span>Scopus Quartile</span>
          </label>
          <select
            value={currentQuartile}
            onChange={(e) => updateFilters({ quartile: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Quartiles</option>
            <option value="Q1">Q1 (Top Quartile)</option>
            <option value="Q2">Q2 (Second Quartile)</option>
            <option value="Q3">Q3 (Third Quartile)</option>
            <option value="Q4">Q4 (Fourth Quartile)</option>
            <option value="UNSPECIFIED">Unspecified</option>
            <option value="NOT_SCOPUS">Not Scopus</option>
          </select>
        </div>

        {/* Publication Type Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            <span>Publication Type</span>
          </label>
          <select
            value={currentPubType}
            onChange={(e) => updateFilters({ publicationType: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="JOURNAL_ARTICLE">Journal Article</option>
            <option value="CONFERENCE_PAPER">Conference Paper</option>
            <option value="BOOK_CHAPTER">Book Chapter</option>
            <option value="REVIEW_ARTICLE">Review Article</option>
            <option value="PATENT">Patent</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">Publication Year</label>
          <select
            value={currentYear}
            onChange={(e) => updateFilters({ year: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>

        {/* Web of Science Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>Web of Science (WoS)</span>
          </label>
          <select
            value={currentWos}
            onChange={(e) => updateFilters({ isWebOfScience: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All (Indexed & Non-WoS)</option>
            <option value="true">WoS Indexed Only</option>
            <option value="false">Non-WoS Only</option>
          </select>
        </div>

        {/* Scopus Filter */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Scopus Indexed</span>
          </label>
          <select
            value={currentScopus}
            onChange={(e) => updateFilters({ isScopus: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="ALL">All (Scopus & Non-Scopus)</option>
            <option value="true">Scopus Indexed Only</option>
            <option value="false">Non-Scopus Only</option>
          </select>
        </div>

        {/* Sorting & Page Size Controls */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-amber-500" />
            <span>Sort & Items</span>
          </label>
          <div className="flex gap-1.5">
            <select
              value={currentSortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="createdAt">Date Created</option>
              <option value="publicationDate">Pub Date</option>
              <option value="title">Title</option>
              <option value="impactFactor">Impact Factor</option>
              <option value="citationCount">Citations</option>
            </select>
            <button
              type="button"
              onClick={() => updateFilters({ sortOrder: currentSortOrder === "asc" ? "desc" : "asc" })}
              className="rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              title={`Toggle Sort Order (Currently ${currentSortOrder.toUpperCase()})`}
            >
              {currentSortOrder === "asc" ? "↑" : "↓"}
            </button>
            <select
              value={currentLimit}
              onChange={(e) => updateFilters({ limit: e.target.value })}
              className="rounded-xl border border-slate-300 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="10">10 / pg</option>
              <option value="20">20 / pg</option>
              <option value="50">50 / pg</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
