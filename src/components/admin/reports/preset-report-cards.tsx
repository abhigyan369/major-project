"use client";

import React from "react";
import { FileSpreadsheet, Award, CheckCircle2, Building2, Users, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresetReportCardsProps {
  onSelectPreset: (presetKey: string, format: "EXCEL" | "CSV") => void;
  isDownloading: boolean;
  activePreset: string | null;
}

export function PresetReportCards({ onSelectPreset, isDownloading, activePreset }: PresetReportCardsProps) {
  const PRESETS = [
    {
      id: "2026_CSE",
      title: "2026 CSE Publications",
      description: "Complete 2026 research output from Department of Computer Science & Engineering",
      icon: FileSpreadsheet,
      accentColor: "border-amber-200 bg-amber-50/40 text-amber-700 hover:border-amber-400",
      iconBg: "bg-amber-500 text-slate-950",
      badge: "Dept CSE",
    },
    {
      id: "Q1_PUBS",
      title: "Q1 Publications",
      description: "High-impact Scopus Q1 indexed publications across all NIE departments",
      icon: Award,
      accentColor: "border-purple-200 bg-purple-50/40 text-purple-700 hover:border-purple-400",
      iconBg: "bg-purple-600 text-white",
      badge: "Scopus Q1",
    },
    {
      id: "PUBLISHED_PUBS",
      title: "Published Publications",
      description: "Verified and final published articles across institutional repositories",
      icon: CheckCircle2,
      accentColor: "border-teal-200 bg-teal-50/40 text-teal-700 hover:border-teal-400",
      iconBg: "bg-teal-600 text-white",
      badge: "Published Status",
    },
    {
      id: "DEPT_PERFORMANCE",
      title: "Department Performance",
      description: "Aggregated department scorecards, faculty targets, & NIRF target achievement %",
      icon: Building2,
      accentColor: "border-blue-200 bg-blue-50/40 text-blue-700 hover:border-blue-400",
      iconBg: "bg-blue-600 text-white",
      badge: "NIRF Scorecards",
    },
    {
      id: "FACULTY_PERFORMANCE",
      title: "Faculty Performance",
      description: "Faculty-wise publication counts, Q1/Q2 distribution, WoS indexing & citations",
      icon: Users,
      accentColor: "border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:border-indigo-400",
      iconBg: "bg-indigo-600 text-white",
      badge: "Faculty Matrix",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <span>Institutional Preset Reports</span>
          </h2>
          <p className="text-xs text-slate-500">1-click automated report generation with standardized headers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset === preset.id;

          return (
            <div
              key={preset.id}
              className={cn(
                "relative group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 shadow-sm bg-white hover:shadow-md",
                preset.accentColor,
                isActive && "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-sm", preset.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                    {preset.badge}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-3">
                  {preset.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => onSelectPreset(preset.id, "EXCEL")}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                  title="Export to Excel (.xlsx)"
                >
                  <Download className="h-3 w-3" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => onSelectPreset(preset.id, "CSV")}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                  title="Export to CSV (.csv)"
                >
                  <FileText className="h-3 w-3 text-slate-500" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
