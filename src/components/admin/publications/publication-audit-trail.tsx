"use client";

import React from "react";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, User, Clock, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Archive, Trash2 } from "lucide-react";

export interface AuditTrailEvent {
  id: string;
  type: "approval" | "audit";
  action: string;
  user: {
    name: string | null;
    email: string;
  } | null;
  comment?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: Date | string;
}

interface PublicationAuditTrailProps {
  events: AuditTrailEvent[];
}

export function PublicationAuditTrail({ events }: PublicationAuditTrailProps) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-xs font-semibold text-slate-600">No audit trail entries recorded yet.</p>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("APPROVE")) {
      return { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
    }
    if (act.includes("REJECT")) {
      return { bg: "bg-red-100 text-red-800 border-red-300", icon: <XCircle className="h-3.5 w-3.5" /> };
    }
    if (act.includes("REQUEST_CHANGES") || act.includes("REVISION")) {
      return { bg: "bg-amber-100 text-amber-800 border-amber-300", icon: <AlertTriangle className="h-3.5 w-3.5" /> };
    }
    if (act.includes("ARCHIVE")) {
      return { bg: "bg-purple-100 text-purple-800 border-purple-300", icon: <Archive className="h-3.5 w-3.5" /> };
    }
    if (act.includes("RESTORE")) {
      return { bg: "bg-blue-100 text-blue-800 border-blue-300", icon: <RefreshCw className="h-3.5 w-3.5" /> };
    }
    if (act.includes("DELETE")) {
      return { bg: "bg-rose-100 text-rose-800 border-rose-300", icon: <Trash2 className="h-3.5 w-3.5" /> };
    }
    return { bg: "bg-slate-100 text-slate-700 border-slate-200", icon: <Clock className="h-3.5 w-3.5" /> };
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <span>Complete Audit Trail & Lifecycle Log ({events.length})</span>
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">Immutable Compliance Log</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event) => {
          const badge = getActionBadge(event.action);
          const userName = event.user?.name || event.user?.email || "System Administrator";

          return (
            <div key={event.id} className="relative group">
              {/* Dot icon on timeline */}
              <div className="absolute -left-[1.85rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-300 shadow-sm text-slate-600 group-hover:border-amber-500 transition-colors">
                {badge.icon}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2 hover:border-slate-300 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase border ${badge.bg}`}>
                      {event.action.replace("PUBLICATION_", "").replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{userName}</span>
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{formatDateTime(event.createdAt)}</span>
                  </span>
                </div>

                {event.comment && (
                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 italic">
                    &quot;{event.comment}&quot;
                  </p>
                )}

                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200/50">
                    {Object.entries(event.details).map(([key, val]) => (
                      <div key={key} className="flex flex-wrap items-center gap-1">
                        <span className="font-semibold text-slate-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                        <span className="font-mono text-[10px] text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {typeof val === "object" ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
