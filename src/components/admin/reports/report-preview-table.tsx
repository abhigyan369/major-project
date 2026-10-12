"use client";

import React from "react";
import { Table, FileSpreadsheet, Download, FileText, Info } from "lucide-react";

interface ReportPreviewTableProps {
  previewData: {
    reportTitle: string;
    reportType: string;
    appliedFilters: string;
    recordCount: number;
    headers: string[];
    previewRows: (string | number)[][];
  } | null;
  isLoading: boolean;
  onExport: (format: "EXCEL" | "CSV") => void;
  isDownloading: boolean;
}

export function ReportPreviewTable({
  previewData,
  isLoading,
  onExport,
  isDownloading,
}: ReportPreviewTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
        <p className="text-xs font-bold text-slate-700">Generating live report preview...</p>
        <p className="text-[11px] text-slate-400">Querying PostgreSQL database and applying filters</p>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200/60 text-slate-500 mx-auto">
          <Table className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800">No Report Preview Generated</h4>
        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
          Select a preset card above or configure custom filter parameters, then click &quot;Apply &amp; Preview&quot; to review the output headers and sample dataset.
        </p>
      </div>
    );
  }

  const { reportTitle, appliedFilters, recordCount, headers, previewRows } = previewData;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      {/* Report Header Banner */}
      <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
              Preview Ready
            </span>
            <h3 className="text-sm font-extrabold text-white tracking-tight">{reportTitle}</h3>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="h-3 w-3 text-amber-400 shrink-0" />
            <span>Applied Filters: <strong className="text-slate-200">{appliedFilters}</strong></span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block mr-2">
            <span className="block text-xs font-bold text-amber-400">{recordCount} Records</span>
            <span className="block text-[10px] text-slate-400">Total Filtered Output</span>
          </div>

          <button
            type="button"
            disabled={isDownloading || recordCount === 0}
            onClick={() => onExport("EXCEL")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            disabled={isDownloading || recordCount === 0}
            onClick={() => onExport("CSV")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <FileText className="h-4 w-4 text-amber-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Metadata Callout */}
      <div className="bg-amber-50/60 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-[11px] text-amber-900 font-medium">
        <span>Showing sample preview of top {previewRows.length} rows (out of {recordCount} total matching records)</span>
        <span>Includes Report Timestamp &amp; Admin Header</span>
      </div>

      {/* Preview Table Data */}
      <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 z-10">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2.5 whitespace-nowrap border-r border-slate-200/70 last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {previewRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500 italic">
                  No records match the selected filter criteria.
                </td>
              </tr>
            ) : (
              previewRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap border-r border-slate-100 last:border-r-0 max-w-xs truncate text-[11px]">
                      {cell !== null && cell !== undefined ? String(cell) : "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
