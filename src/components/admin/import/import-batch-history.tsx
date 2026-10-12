"use client";

import React from "react";
import { FileSpreadsheet, Calendar, User, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface BatchHistoryItem {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  importedCount: number;
  rejectedCount: number;
  updatedCount: number;
  warningsCount: number;
  errorsCount: number;
  createdAt: string | Date;
  importedBy: {
    name: string | null;
    email: string;
  };
}

interface ImportBatchHistoryProps {
  batches: BatchHistoryItem[];
  isLoading?: boolean;
}

export function ImportBatchHistory({ batches, isLoading }: ImportBatchHistoryProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
        Loading import batch history...
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
        <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700">No Past Import Batches</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          No Excel imports have been executed yet. Once you confirm an import, the batch summary will be permanently logged here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-amber-500" />
            <span>Excel Data Import Audit Log & Batch History</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Historical transaction records of legacy Excel workbooks imported into PostgreSQL database.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
          {batches.length} Batch{batches.length > 1 ? "es" : ""} Executed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Batch ID / File Name</th>
              <th className="py-3 px-4">Imported By</th>
              <th className="py-3 px-4 text-center">Total Rows</th>
              <th className="py-3 px-4 text-center">Imported</th>
              <th className="py-3 px-4 text-center">Updated</th>
              <th className="py-3 px-4 text-center">Rejected</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{batch.fileName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">ID: {batch.id}</span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {batch.importedBy.name || "System Admin"}
                      </span>
                      <span className="text-[10px] text-slate-400">{batch.importedBy.email}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4 text-center font-bold text-slate-800">
                  {batch.totalRows}
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {batch.importedCount}
                  </span>
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {batch.updatedCount}
                  </span>
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {batch.rejectedCount}
                  </span>
                </td>

                <td className="py-3 px-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{new Date(batch.createdAt).toLocaleString()}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    {batch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
