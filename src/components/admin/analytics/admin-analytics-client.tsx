"use client";

import React, { useState, useCallback } from "react";
import {
  AnalyticsFilters,
  AnalyticsFiltersState,
} from "./analytics-filters";
import { AnalyticsKpiCards, KpiData } from "./analytics-kpi-cards";
import { AnalyticsCharts } from "./analytics-charts";
import { DepartmentScorecard, DepartmentScorecardItem } from "./department-scorecard";
import { FacultyPerformanceTable, FacultyPerformanceItem } from "./faculty-performance-table";
import { KpiDefinitionsModal } from "./kpi-definitions-modal";
import { BarChart3, RefreshCw, AlertTriangle, FileSpreadsheet } from "lucide-react";

export interface ChartsData {
  publicationsByYear: { year: string; count: number }[];
  publicationsByDepartment: { code: string; count: number }[];
  publicationStatus: { name: string; rawStatus: string; value: number }[];
  scopusQuartile: { quartile: string; count: number }[];
  webOfScienceBreakdown: { category: string; value: number }[];
  publicationTypeBreakdown: { type: string; rawType: string; count: number }[];
  researchAreas: { area: string; count: number }[];
  departmentTargetPerformance: {
    code: string;
    target: number;
    actual: number;
    achievementPct: number;
  }[];
}

export interface AnalyticsResponseData {
  kpiData: KpiData;
  charts: ChartsData;
  departmentScorecard: DepartmentScorecardItem[];
  facultyPerformance: FacultyPerformanceItem[];
  options: {
    years: string[];
    campuses: { id: string; code: string; name: string }[];
    departments: { id: string; code: string; name: string }[];
    faculty: { id: string; name: string; email: string }[];
  };
}

interface AdminAnalyticsClientProps {
  initialData: AnalyticsResponseData;
}

const DEFAULT_FILTERS: AnalyticsFiltersState = {
  year: "ALL",
  startDate: "",
  endDate: "",
  campusId: "ALL",
  departmentId: "ALL",
  facultyId: "ALL",
  publicationType: "ALL",
  status: "ALL",
  scopusQuartile: "ALL",
  webOfScience: "ALL",
  targetPerFaculty: 3.0,
};

export function AdminAnalyticsClient({ initialData }: AdminAnalyticsClientProps) {
  const [filters, setFilters] = useState<AnalyticsFiltersState>(DEFAULT_FILTERS);
  const [data, setData] = useState<AnalyticsResponseData>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Fetch data dynamically when filters change
  const fetchAnalytics = useCallback(async (currentFilters: AnalyticsFiltersState) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (currentFilters.year !== "ALL") params.set("year", currentFilters.year);
      if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
      if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);
      if (currentFilters.campusId !== "ALL") params.set("campusId", currentFilters.campusId);
      if (currentFilters.departmentId !== "ALL") params.set("departmentId", currentFilters.departmentId);
      if (currentFilters.facultyId !== "ALL") params.set("facultyId", currentFilters.facultyId);
      if (currentFilters.publicationType !== "ALL") params.set("publicationType", currentFilters.publicationType);
      if (currentFilters.status !== "ALL") params.set("status", currentFilters.status);
      if (currentFilters.scopusQuartile !== "ALL") params.set("scopusQuartile", currentFilters.scopusQuartile);
      if (currentFilters.webOfScience !== "ALL") params.set("webOfScience", currentFilters.webOfScience);
      if (currentFilters.targetPerFaculty !== 3.0) params.set("targetPerFaculty", currentFilters.targetPerFaculty.toString());

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to load analytics data");
      }

      setData(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while fetching analytics.";
      console.error("Fetch Analytics Error:", err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter change handler
  const handleFilterChange = (key: keyof AnalyticsFiltersState, value: string | number) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchAnalytics(updated);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchAnalytics(DEFAULT_FILTERS);
  };

  // Department scorecard drill-down selection
  const handleSelectDeptScorecard = (deptId: string) => {
    handleFilterChange("departmentId", deptId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Institutional Admin Analytics Engine
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Real-time analytics computed directly from PostgreSQL. Zero hardcoded values. Filter by year, department, campus, faculty, publication type, Scopus quartile, and Web of Science status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin/reports"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-100 hover:bg-slate-700 transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-amber-400" />
            <span>Export Reports</span>
          </a>
          <button
            onClick={() => fetchAnalytics(filters)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Dashboard</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        options={data?.options || { years: [], campuses: [], departments: [], faculty: [] }}
        onOpenRules={() => setIsRulesModalOpen(true)}
      />

      {/* Error Alert State */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold">Analytics Data Error</h3>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics(filters)}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-500 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards (12 Cards) */}
          <AnalyticsKpiCards data={data.kpiData} />

          {/* Department Scorecard Table */}
          <DepartmentScorecard
            scorecard={data.departmentScorecard}
            selectedDeptId={filters.departmentId}
            onSelectDept={handleSelectDeptScorecard}
          />

          {/* Charts Visualizations Grid (8 Charts) */}
          <AnalyticsCharts chartsData={data.charts} />

          {/* Faculty Performance Table */}
          <FacultyPerformanceTable facultyList={data.facultyPerformance} />
        </>
      )}

      {/* KPI Definitions Modal */}
      <KpiDefinitionsModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
