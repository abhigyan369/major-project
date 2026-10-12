"use client";

import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Award,
  ShieldCheck,
  TrendingUp,
  FileText,
  Quote,
} from "lucide-react";

export interface KpiData {
  totalPublications: number;
  publishedCount: number;
  approvedCount: number;
  pendingCount: number;
  underReviewCount: number;
  revisionRequiredCount: number;
  rejectedCount: number;
  q1Count: number;
  q2Count: number;
  q1q2Count: number;
  wosCount: number;
  avgCitations: number;
}

interface AnalyticsKpiCardsProps {
  data: KpiData;
}

export function AnalyticsKpiCards({ data }: AnalyticsKpiCardsProps) {
  const cards = [
    {
      title: "Total Publications",
      value: data.totalPublications,
      subtitle: "Current active filter set",
      icon: BookOpen,
      color: "border-slate-200 bg-white text-slate-900",
      iconColor: "text-blue-600 bg-blue-50",
    },
    {
      title: "Published",
      value: data.publishedCount,
      subtitle: "Official published repository",
      icon: CheckCircle2,
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-950",
      iconColor: "text-emerald-600 bg-emerald-100",
      badge: "Institutional Metric",
    },
    {
      title: "Approved",
      value: data.approvedCount,
      subtitle: "Verified by Admin",
      icon: ShieldCheck,
      color: "border-teal-200 bg-teal-50/40 text-teal-950",
      iconColor: "text-teal-600 bg-teal-100",
    },
    {
      title: "Pending",
      value: data.pendingCount,
      subtitle: "Awaiting initial review",
      icon: Clock,
      color: "border-amber-200 bg-amber-50/40 text-amber-950",
      iconColor: "text-amber-600 bg-amber-100",
    },
    {
      title: "Under Review",
      value: data.underReviewCount,
      subtitle: "In editorial evaluation",
      icon: FileText,
      color: "border-sky-200 bg-sky-50/40 text-sky-950",
      iconColor: "text-sky-600 bg-sky-100",
    },
    {
      title: "Revision Required",
      value: data.revisionRequiredCount,
      subtitle: "Changes requested",
      icon: AlertCircle,
      color: "border-orange-200 bg-orange-50/40 text-orange-950",
      iconColor: "text-orange-600 bg-orange-100",
    },
    {
      title: "Rejected",
      value: data.rejectedCount,
      subtitle: "Non-compliant records",
      icon: XCircle,
      color: "border-rose-200 bg-rose-50/40 text-rose-950",
      iconColor: "text-rose-600 bg-rose-100",
    },
    {
      title: "Q1 Publications",
      value: data.q1Count,
      subtitle: "Scopus Quartile 1",
      icon: Award,
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-950",
      iconColor: "text-indigo-600 bg-indigo-100",
    },
    {
      title: "Q2 Publications",
      value: data.q2Count,
      subtitle: "Scopus Quartile 2",
      icon: Award,
      color: "border-violet-200 bg-violet-50/40 text-violet-950",
      iconColor: "text-violet-600 bg-violet-100",
    },
    {
      title: "Q1 + Q2 Total",
      value: data.q1q2Count,
      subtitle: "High impact NIRF quality index",
      icon: TrendingUp,
      color: "border-purple-200 bg-purple-50/40 text-purple-950",
      iconColor: "text-purple-600 bg-purple-100",
      badge: "NIRF Weighted",
    },
    {
      title: "Web of Science (WoS)",
      value: data.wosCount,
      subtitle: "WoS indexed output",
      icon: ShieldCheck,
      color: "border-cyan-200 bg-cyan-50/40 text-cyan-950",
      iconColor: "text-cyan-600 bg-cyan-100",
    },
    {
      title: "Average Citations",
      value: data.avgCitations,
      subtitle: "Citations per paper",
      icon: Quote,
      color: "border-amber-200 bg-amber-50/30 text-slate-900",
      iconColor: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">
                {card.title}
              </span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-black tracking-tight font-mono">{card.value}</p>
              {card.badge && (
                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-500 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
