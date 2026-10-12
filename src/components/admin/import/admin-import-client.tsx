"use client";

import React, { useState } from "react";
import { ParseResult, ImportOptions } from "@/server/services/excel-import.service";
import {
  previewLegacyWorkbookAction,
  previewUploadedExcelAction,
  confirmBatchImportAction,
  getImportHistoryAction,
} from "@/server/actions/excel-import.actions";
import { ImportPreviewTable } from "./import-preview-table";
import { ImportBatchHistory } from "./import-batch-history";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Database,
  Search,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminImportClientProps {
  initialHistory: any[];
}

export function AdminImportClient({ initialHistory }: AdminImportClientProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [history, setHistory] = useState<any[]>(initialHistory);

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [filterTab, setFilterTab] = useState<"ALL" | "VALID" | "WARNING" | "ERROR" | "DUPLICATE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [duplicateHandling, setDuplicateHandling] = useState<"SKIP" | "UPDATE" | "ALLOW">("SKIP");
  const [skipErrors, setSkipErrors] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importSuccessResult, setImportSuccessResult] = useState<{
    batchId: string;
    importedCount: number;
    rejectedCount: number;
    updatedCount: number;
    totalRows: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger preview of legacy workbook in workspace root
  const handleLoadLegacyWorkbook = async () => {
    setIsLoadingPreview(true);
    setErrorMessage(null);
    setImportSuccessResult(null);

    const res = await previewLegacyWorkbookAction();
    setIsLoadingPreview(false);

    if (res.success && res.data) {
      setParseResult(res.data);
    } else {
      setErrorMessage(res.error || "Failed to load legacy workbook.");
    }
  };

  // Trigger preview of custom uploaded Excel file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPreview(true);
    setErrorMessage(null);
    setImportSuccessResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await previewUploadedExcelAction(formData);
    setIsLoadingPreview(false);

    if (res.success && res.data) {
      setParseResult(res.data);
    } else {
      setErrorMessage(res.error || "Failed to parse uploaded Excel file.");
    }
  };

  // Execute database transaction import
  const handleExecuteImport = async () => {
    if (!parseResult) return;

    setIsImporting(true);
    setErrorMessage(null);

    const options: ImportOptions = {
      skipErrors,
      duplicateHandling,
    };

    const res = await confirmBatchImportAction(parseResult, options);
    setIsImporting(false);
    setShowConfirmModal(false);

    if (res.success && res.data) {
      setImportSuccessResult(res.data);

      // Refresh history log
      const histRes = await getImportHistoryAction();
      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } else {
      setErrorMessage(res.error || "Batch import failed.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <FileSpreadsheet className="h-6 w-6 text-amber-500" />
            <span>Legacy Excel Data Import System</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parse, validate, normalize, preview, and import legacy research tracker workbooks into PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <Database className="h-3.5 w-3.5" />
            PostgreSQL: Source of Truth
          </span>
        </div>
      </div>

      {/* Step 1: Upload or Load Legacy Workbook Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-4 w-4 text-amber-500" />
              <span>Step 1: Upload or Load Legacy Workbook</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select the legacy workbook <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">NIE_Publication_Tracker_Enhanced.xlsx</code> or upload a custom Excel file.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadLegacyWorkbook}
              disabled={isLoadingPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isLoadingPreview ? (
                <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-400" />
              )}
              <span>Load Existing NIE Workbook</span>
            </button>

            <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 cursor-pointer transition-all">
              <Upload className="h-4 w-4" />
              <span>Upload Custom Excel (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoadingPreview}
              />
            </label>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs font-medium flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Import Error</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Import Success Banner */}
        {importSuccessResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-xs font-medium space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Database Batch Import Completed Successfully!</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 p-3 rounded-lg border border-emerald-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Batch ID</span>
                <span className="font-mono text-xs font-bold text-slate-800">{importSuccessResult.batchId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Imported Records</span>
                <span className="text-sm font-black text-emerald-900">{importSuccessResult.importedCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Updated Records</span>
                <span className="text-sm font-black text-indigo-900">{importSuccessResult.updatedCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Rejected Records</span>
                <span className="text-sm font-black text-rose-900">{importSuccessResult.rejectedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Validation Preview & KPI Summary Cards */}
      {parseResult && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                <span>Step 2: Validation & Normalization Preview</span>
              </h2>
              <p className="text-xs text-slate-500">
                Workbook: <span className="font-bold text-slate-800">{parseResult.fileName}</span> (Row counts and normalized mappings)
              </p>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
            >
              <Database className="h-4 w-4" />
              <span>Confirm & Execute Database Import</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Validation Metrics KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Rows</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{parseResult.totalRows}</span>
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Valid Rows</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-900">{parseResult.validCount}</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Warnings</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-900">{parseResult.warningCount}</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Errors</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-900">{parseResult.errorCount}</span>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Duplicates</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-indigo-900">{parseResult.duplicateCount}</span>
                <Copy className="h-4 w-4 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Import Configuration & Duplicate Strategy Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-amber-500" />
              <span>Import Behavior & Duplicate Handling Strategy</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Duplicate Resolution Strategy:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateHandling("SKIP")}
                    className={cn(
                      "px-3 py-2 rounded-xl font-bold border text-center transition-all",
                      duplicateHandling === "SKIP"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Skip Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateHandling("UPDATE")}
                    className={cn(
                      "px-3 py-2 rounded-xl font-bold border text-center transition-all",
                      duplicateHandling === "UPDATE"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Update Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateHandling("ALLOW")}
                    className={cn(
                      "px-3 py-2 rounded-xl font-bold border text-center transition-all",
                      duplicateHandling === "ALLOW"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Allow All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">
                  Error Handling Option:
                </label>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={skipErrors}
                    onChange={(e) => setSkipErrors(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-800 font-medium">
                    Automatically skip rows with critical errors during database transaction
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Row Inspector & Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs font-semibold">
                <button
                  onClick={() => setFilterTab("ALL")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all",
                    filterTab === "ALL"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  All ({parseResult.totalRows})
                </button>
                <button
                  onClick={() => setFilterTab("WARNING")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                    filterTab === "WARNING"
                      ? "bg-white text-amber-800 shadow-sm font-bold"
                      : "text-slate-600 hover:text-amber-700"
                  )}
                >
                  <AlertTriangle className="h-3 w-3 text-amber-500" /> Warnings ({parseResult.warningCount})
                </button>
                <button
                  onClick={() => setFilterTab("ERROR")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                    filterTab === "ERROR"
                      ? "bg-white text-rose-800 shadow-sm font-bold"
                      : "text-slate-600 hover:text-rose-700"
                  )}
                >
                  <XCircle className="h-3 w-3 text-rose-500" /> Errors ({parseResult.errorCount})
                </button>
                <button
                  onClick={() => setFilterTab("DUPLICATE")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                    filterTab === "DUPLICATE"
                      ? "bg-white text-indigo-800 shadow-sm font-bold"
                      : "text-slate-600 hover:text-indigo-700"
                  )}
                >
                  <Copy className="h-3 w-3 text-indigo-500" /> Duplicates ({parseResult.duplicateCount})
                </button>
                <button
                  onClick={() => setFilterTab("VALID")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                    filterTab === "VALID"
                      ? "bg-white text-emerald-800 shadow-sm font-bold"
                      : "text-slate-600 hover:text-emerald-700"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Clean ({parseResult.validCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search title, dept, DOI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Detailed Row Inspector Table */}
            <ImportPreviewTable
              rows={parseResult.rows}
              filterTab={filterTab}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      )}

      {/* Step 3: Past Import History Log */}
      <div className="pt-4">
        <ImportBatchHistory batches={history} />
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && parseResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
              <Database className="h-5 w-5 text-amber-500" />
              <span>Confirm Database Batch Import</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                You are about to import records from workbook{" "}
                <span className="font-bold text-slate-900">{parseResult.fileName}</span> into the PostgreSQL database.
              </p>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Total Parsed Rows:</span>
                  <span className="font-bold text-slate-900">{parseResult.totalRows}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Clean Valid Rows:</span>
                  <span>{parseResult.validCount}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Rows with Warnings:</span>
                  <span>{parseResult.warningCount}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Duplicate Handling:</span>
                  <span>{duplicateHandling}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * This operation runs inside a single database transaction. An Import Batch record and Audit Log entry will be permanently recorded.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Confirm & Import Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
