"use client";

import React, { useState } from "react";
import { ParsedImportRow } from "@/server/services/excel-import.service";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportPreviewTableProps {
  rows: ParsedImportRow[];
  filterTab: "ALL" | "VALID" | "WARNING" | "ERROR" | "DUPLICATE";
  searchQuery: string;
}

export function ImportPreviewTable({
  rows,
  filterTab,
  searchQuery,
}: ImportPreviewTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleExpand = (rowIdx: number) => {
    setExpandedRows((prev) => ({ ...prev, [rowIdx]: !prev[rowIdx] }));
  };

  // Filter rows based on tab and search query
  const filteredRows = rows.filter((r) => {
    if (filterTab === "VALID" && r.rowStatus !== "VALID") return false;
    if (filterTab === "WARNING" && r.rowStatus !== "WARNING") return false;
    if (filterTab === "ERROR" && r.rowStatus !== "ERROR") return false;
    if (filterTab === "DUPLICATE" && r.rowStatus !== "DUPLICATE") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = r.raw.title?.toLowerCase().includes(q);
      const deptMatch = r.raw.department?.toLowerCase().includes(q);
      const doiMatch = r.raw.doi?.toLowerCase().includes(q);
      const authorsMatch = r.raw.authors?.toLowerCase().includes(q);
      return titleMatch || deptMatch || doiMatch || authorsMatch;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">Row</th>
              <th className="py-3 px-4 w-28">Status</th>
              <th className="py-3 px-4">Publication Title & Metadata</th>
              <th className="py-3 px-4 w-28">Department</th>
              <th className="py-3 px-4 w-28">Pub Type</th>
              <th className="py-3 px-4 w-28">Status Stage</th>
              <th className="py-3 px-4 w-28 text-center">Issues</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No records match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isExpanded = !!expandedRows[row.excelRowIndex];
                const norm = row.normalized;

                return (
                  <React.Fragment key={row.excelRowIndex}>
                    <tr
                      onClick={() => toggleExpand(row.excelRowIndex)}
                      className={cn(
                        "cursor-pointer hover:bg-slate-50/80 transition-colors",
                        row.rowStatus === "ERROR" && "bg-rose-50/30 hover:bg-rose-50/50",
                        row.rowStatus === "DUPLICATE" && "bg-amber-50/30 hover:bg-amber-50/50",
                        row.rowStatus === "WARNING" && "bg-amber-50/20 hover:bg-amber-50/40"
                      )}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-500">
                        {row.excelRowIndex}
                      </td>

                      <td className="py-3 px-4">
                        {row.rowStatus === "VALID" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        )}
                        {row.rowStatus === "WARNING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> Warning
                          </span>
                        )}
                        {row.rowStatus === "ERROR" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="h-3 w-3" /> Error
                          </span>
                        )}
                        {row.rowStatus === "DUPLICATE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <Copy className="h-3 w-3" /> Duplicate
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {row.raw.title || <span className="text-rose-500 italic">[Missing Title]</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>Authors: {row.raw.authors || "None"}</span>
                          {row.raw.doi && <span className="font-mono text-slate-400">DOI: {row.raw.doi}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-800">
                            {norm?.departmentCode || row.raw.department || "N/A"}
                          </span>
                          {row.raw.department &&
                            norm?.departmentCode &&
                            row.raw.department.trim() !== norm.departmentCode && (
                              <span className="text-[10px] text-amber-600 font-mono">
                                ({row.raw.department.trim()})
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {norm?.publicationType.replace("_", " ") || "JOURNAL"}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase">
                          {norm?.status || "DRAFT"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold">
                        {row.errors.length > 0 ? (
                          <span className="text-rose-600">{row.errors.length} err</span>
                        ) : row.warnings.length > 0 ? (
                          <span className="text-amber-600">{row.warnings.length} warn</span>
                        ) : (
                          <span className="text-emerald-600">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                    </tr>

                    {/* Collapsible Expanded Details Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={8} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Raw vs Normalized Mapping Box */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                Data Normalization Mapping
                              </h4>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                  <span className="text-slate-500">Department:</span>
                                  <span className="font-semibold flex items-center gap-1">
                                    <span className="text-slate-400">"{row.raw.department}"</span>
                                    <ArrowRight className="h-3 w-3 text-amber-500" />
                                    <span className="text-amber-700 font-bold">{norm?.departmentCode}</span>
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                  <span className="text-slate-500">Status Stage:</span>
                                  <span className="font-semibold flex items-center gap-1">
                                    <span className="text-slate-400">"{row.raw.status}"</span>
                                    <ArrowRight className="h-3 w-3 text-amber-500" />
                                    <span className="text-slate-900 font-bold">{norm?.status}</span>
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                  <span className="text-slate-500">Publication Type:</span>
                                  <span className="font-semibold flex items-center gap-1">
                                    <span className="text-slate-400">"{row.raw.type}"</span>
                                    <ArrowRight className="h-3 w-3 text-amber-500" />
                                    <span className="text-slate-900 font-bold">{norm?.publicationType}</span>
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-slate-500">Quartile & Indexing:</span>
                                  <span className="font-semibold text-slate-800">
                                    {norm?.quartile} | WoS: {norm?.isWebOfScience ? "Yes" : "No"} | Scopus: {norm?.isScopus ? "Yes" : "No"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Warnings & Errors List */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Validation Feedback & Notes
                              </h4>
                              {row.errors.length === 0 && row.warnings.length === 0 ? (
                                <p className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5 py-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  All validation checks passed cleanly.
                                </p>
                              ) : (
                                <ul className="space-y-1.5 text-xs">
                                  {row.errors.map((err, i) => (
                                    <li
                                      key={`err-${i}`}
                                      className="flex items-start gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200"
                                    >
                                      <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                                      <span>Row {row.excelRowIndex}: {err}</span>
                                    </li>
                                  ))}
                                  {row.warnings.map((warn, i) => (
                                    <li
                                      key={`warn-${i}`}
                                      className="flex items-start gap-1.5 text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200"
                                    >
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                                      <span>Row {row.excelRowIndex}: {warn}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
