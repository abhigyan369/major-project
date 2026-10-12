"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Sparkles, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { PresetReportCards } from "./preset-report-cards";
import { CustomReportFilters, ReportFilterState, FilterOptions } from "./custom-report-filters";
import { ReportPreviewTable } from "./report-preview-table";

interface AdminReportsClientProps {
  options: FilterOptions;
}

const DEFAULT_FILTERS: ReportFilterState = {
  reportType: "PUBLICATIONS",
  year: "ALL",
  quarter: "ALL",
  startDate: "",
  endDate: "",
  departmentId: "ALL",
  campusId: "ALL",
  facultyId: "ALL",
  publicationType: "ALL",
  status: "ALL",
  scopusQuartile: "ALL",
  webOfScience: "ALL",
  search: "",
};

export function AdminReportsClient({ options }: AdminReportsClientProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilterState>(DEFAULT_FILTERS);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate initial preview on mount
  useEffect(() => {
    fetchPreview(DEFAULT_FILTERS);
  }, []);

  const handleFilterChange = (key: keyof ReportFilterState, value: string) => {
    setActivePreset(null);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setActivePreset(null);
    setFilters(DEFAULT_FILTERS);
    fetchPreview(DEFAULT_FILTERS);
  };

  const fetchPreview = async (currentFilters: ReportFilterState, presetOverride?: string | null) => {
    try {
      setIsLoadingPreview(true);
      setErrorMessage(null);

      const payload = {
        ...currentFilters,
        preset: presetOverride !== undefined ? presetOverride : activePreset,
        previewOnly: true,
      };

      const res = await fetch("/api/admin/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to load report preview");
      }

      const json = await res.json();
      if (json.success) {
        setPreviewData({
          reportTitle: json.reportTitle,
          reportType: json.reportType,
          appliedFilters: json.appliedFilters,
          recordCount: json.recordCount,
          headers: json.headers,
          previewRows: json.previewRows,
        });
      }
    } catch (err: any) {
      console.error("Preview fetch error:", err);
      setErrorMessage(err.message || "Failed to generate report preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePresetSelect = async (presetKey: string, format: "EXCEL" | "CSV") => {
    setActivePreset(presetKey);
    // Execute direct download for preset
    await triggerDownload(format, presetKey);
    // Update preview for preset
    fetchPreview(filters, presetKey);
  };

  const triggerDownload = async (format: "EXCEL" | "CSV", presetOverride?: string | null) => {
    try {
      setIsDownloading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      const pKey = presetOverride !== undefined ? presetOverride : activePreset;
      if (pKey) params.set("preset", pKey);
      params.set("reportType", filters.reportType);
      params.set("format", format);
      if (filters.year && filters.year !== "ALL") params.set("year", filters.year);
      if (filters.quarter && filters.quarter !== "ALL") params.set("quarter", filters.quarter);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.departmentId && filters.departmentId !== "ALL") params.set("departmentId", filters.departmentId);
      if (filters.campusId && filters.campusId !== "ALL") params.set("campusId", filters.campusId);
      if (filters.facultyId && filters.facultyId !== "ALL") params.set("facultyId", filters.facultyId);
      if (filters.publicationType && filters.publicationType !== "ALL") params.set("publicationType", filters.publicationType);
      if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters.scopusQuartile && filters.scopusQuartile !== "ALL") params.set("scopusQuartile", filters.scopusQuartile);
      if (filters.webOfScience && filters.webOfScience !== "ALL") params.set("webOfScience", filters.webOfScience);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/admin/reports/export?${params.toString()}`);

      if (!res.ok) {
        let errText = "Failed to export report";
        try {
          const errJson = await res.json();
          errText = errJson.error || errText;
        } catch {
          // non-json error
        }
        throw new Error(errText);
      }

      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `NIE_Report.${format === "CSV" ? "csv" : "xlsx"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Export download error:", err);
      setErrorMessage(err.message || "Failed to trigger report download");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
              Institutional Admin Tools
            </span>
            <span className="text-xs font-semibold text-slate-500">Phase 12</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1 tracking-tight">
            <FileSpreadsheet className="h-7 w-7 text-amber-500" />
            <span>Institutional Reports &amp; Data Export Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Generate, preview, and download institutional publication archives, department NIRF scorecards, and faculty research metrics in CSV and Excel formats.
          </p>
        </div>

        {/* Global Quick Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDownloading}
            onClick={() => triggerDownload("EXCEL")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export Active View (Excel)</span>
          </button>
          <button
            type="button"
            disabled={isDownloading}
            onClick={() => triggerDownload("CSV")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <FileText className="h-4 w-4 text-amber-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 1: Preset Quick Action Cards */}
      <PresetReportCards
        onSelectPreset={handlePresetSelect}
        isDownloading={isDownloading}
        activePreset={activePreset}
      />

      {/* Section 2: Custom Filter Configuration */}
      <CustomReportFilters
        filters={filters}
        onChangeFilter={handleFilterChange}
        onResetFilters={handleResetFilters}
        options={options}
        onGeneratePreview={() => fetchPreview(filters)}
        isLoadingPreview={isLoadingPreview}
      />

      {/* Section 3: Live Preview Table & Metadata */}
      <ReportPreviewTable
        previewData={previewData}
        isLoading={isLoadingPreview}
        onExport={(format) => triggerDownload(format)}
        isDownloading={isDownloading}
      />
    </div>
  );
}
