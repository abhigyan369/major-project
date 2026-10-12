"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  User as UserIcon,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { getAuditLogsAction } from "@/server/actions/audit.actions";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [actionType, setActionType] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchLogs = async (currentPage = 1, currentSearch = search, currentAction = actionType) => {
    setIsLoading(true);
    try {
      const res = await getAuditLogsAction({
        page: currentPage,
        limit: 20,
        search: currentSearch,
        actionType: currentAction,
      });

      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
        setPage(res.currentPage || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, search, actionType);
  }, [search, actionType]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Breadcrumb */}
      <div className="space-y-2">
        <Breadcrumb items={[{ label: "System Audit Logs" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <span>System Audit Trail</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Institutional log of administrative changes, security modifications, and publication updates
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{totalCount} Total Logged Events</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, entity, or ID..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Action Types</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="ROLE_CHANGE">ROLE_CHANGE</option>
            <option value="IMPORT">IMPORT</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-xs">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Inbox className="h-10 w-10 stroke-1 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No audit events found</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              No logged system activities match your search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-700">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          log.action === "CREATE" || log.action === "IMPORT"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action === "DELETE"
                            ? "bg-rose-100 text-rose-800"
                            : log.action === "STATUS_CHANGE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {log.entityType} {log.entityId ? `#${log.entityId.substring(0, 8)}` : ""}
                    </td>
                    <td className="py-3 px-4">
                      {log.user ? (
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900">{log.user.name || log.user.email}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({log.user.role})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System / Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page <strong className="text-slate-900">{page}</strong> of{" "}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
