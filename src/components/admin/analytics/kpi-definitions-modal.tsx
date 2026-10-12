"use client";

import React from "react";
import { Info, X, ShieldCheck, CheckCircle2, Award, Target, BookOpen, AlertTriangle } from "lucide-react";

interface KpiDefinitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KpiDefinitionsModal({ isOpen, onClose }: KpiDefinitionsModalProps) {
  if (!isOpen) return null;

  const kpiDefinitions = [
    {
      title: "Total Publications",
      formula: "Count of all research records matching active filters",
      description:
        "Comprehensive tally of institutional research outputs under current search criteria.",
      statusScope: "Includes all statuses",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Published Publications",
      formula: "Count of records where status = 'PUBLISHED'",
      description:
        "Official publications successfully accepted, printed, or digitally indexed in peer-reviewed venues.",
      statusScope: "PUBLISHED only (Used for Institutional Achievement %)",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Approved Submissions",
      formula: "Count of records where status = 'APPROVED'",
      description:
        "Submissions verified and endorsed by Admin, awaiting final publication print or release.",
      statusScope: "APPROVED only",
      icon: ShieldCheck,
      color: "text-teal-600 bg-teal-50 border-teal-200",
    },
    {
      title: "Pending & In-Review",
      formula: "Status = 'SUBMITTED' or 'UNDER_REVIEW'",
      description:
        "Research manuscripts submitted by faculty currently undergoing administrative or editorial peer review.",
      statusScope: "SUBMITTED / UNDER_REVIEW",
      icon: Info,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Revision Required",
      formula: "Status = 'REVISION_REQUIRED'",
      description:
        "Submissions sent back to faculty for administrative compliance corrections or updated metadata.",
      statusScope: "REVISION_REQUIRED",
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50 border-orange-200",
    },
    {
      title: "Scopus Q1 & Q2 Index",
      formula: "Quartile = 'Q1' or 'Q2' in Scopus Master List",
      description:
        "Top-tier research output meeting NIRF high-impact publication criteria.",
      statusScope: "Scopus Q1 & Q2 rated journals",
      icon: Award,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      title: "Web of Science (WoS)",
      formula: "isWebOfScience = true",
      description:
        "Publications indexed in Clarivate Web of Science (SCIE, SSCI, AHCI).",
      statusScope: "WoS indexed publications",
      icon: ShieldCheck,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "Department Target Output",
      formula: "Target = Faculty Strength × Target Per Faculty (Default 3.0)",
      description:
        "Institutional annual benchmark calculated using authoritative faculty counts for each department.",
      statusScope: "Configurable multiplier per faculty",
      icon: Target,
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      title: "Department Achievement %",
      formula: "Achievement % = ( Published Publications / Target ) × 100",
      description:
        "Percentage of annual publication target achieved. Handles target = 0 safely without division errors.",
      statusScope: "Excludes Drafts & Rejected records",
      icon: Award,
      color: "text-emerald-700 bg-emerald-100 border-emerald-300",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shadow-sm">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Institutional KPI Definitions & Business Rules
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative mathematical formulas and data filtering rules governing the analytics engine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {kpiDefinitions.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${kpi.color}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900">{kpi.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-white/80 border border-slate-200 text-slate-800 shadow-2xs">
                    {kpi.statusScope}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs font-mono font-semibold text-slate-800 bg-white/70 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                    Formula: {kpi.formula}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{kpi.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs text-slate-500">
          <span>NIE Research Portal • Governance & Compliance</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition-colors"
          >
            Close Rules Document
          </button>
        </div>
      </div>
    </div>
  );
}
