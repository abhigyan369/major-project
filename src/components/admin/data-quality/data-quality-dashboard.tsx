"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  DataQualityOverview,
  QualityMetricKey,
  AffectedPublicationItem,
} from "@/server/services/data-quality.service";
import {
  getAffectedPublicationsAction,
  getDataQualityOverviewAction,
} from "@/server/actions/data-quality.actions";
import { DataQualityFixModal } from "./data-quality-fix-modal";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  Database,
  Building2,
  User,
  RefreshCw,
  Filter,
} from "lucide-react";

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}

interface DataQualityDashboardProps {
  initialOverview: DataQualityOverview;
  initialAffected: AffectedPublicationItem[];
  departments: DepartmentOption[];
}

export function DataQualityDashboard({
  initialOverview,
  initialAffected,
  departments,
}: DataQualityDashboardProps) {
  const [overview, setOverview] = useState<DataQualityOverview>(initialOverview);
  const [activeMetricKey, setActiveMetricKey] = useState<QualityMetricKey>("ALL_ISSUES");
  const [affectedList, setAffectedList] = useState<AffectedPublicationItem[]>(initialAffected);
  const [isPending, startTransition] = useTransition();
  const [searchFilter, setSearchFilter] = useState("");

  const handleSelectMetric = (metricKey: QualityMetricKey) => {
    setActiveMetricKey(metricKey);
    startTransition(async () => {
      const res = await getAffectedPublicationsAction(metricKey);
      if (res.success) {
        setAffectedList(res.publications);
      }
    });
  };

  const handleRefreshData = () => {
    startTransition(async () => {
      const [overviewRes, affectedRes] = await Promise.all([
        getDataQualityOverviewAction(),
        getAffectedPublicationsAction(activeMetricKey),
      ]);
      if (overviewRes.success && overviewRes.overview) {
        setOverview(overviewRes.overview);
      }
      if (affectedRes.success && affectedRes.publications) {
        setAffectedList(affectedRes.publications);
      }
    });
  };

  // Filter affected list by search query (title, author, doi, department)
  const filteredList = affectedList.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.doi && item.doi.toLowerCase().includes(q)) ||
      item.department.code.toLowerCase().includes(q) ||
      item.department.name.toLowerCase().includes(q) ||
      (item.faculty.name && item.faculty.name.toLowerCase().includes(q)) ||
      item.faculty.email.toLowerCase().includes(q)
    );
  });

  // Calculate score badge color
  const score = overview.qualityScore;
  const scoreColorClass =
    score >= 90
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 75
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  const progressGaugeColor =
    score >= 90 ? "bg-emerald-500" : score >= 75 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="space-y-6">
      {/* Institutional Banner with Data Quality Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>Administrator Data Integrity Audit</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Data Quality Dashboard
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Monitor institutional research database hygiene, identify incomplete or inconsistent publications, and perform audited data corrections.
          </p>
        </div>

        {/* Quality Score Display Box */}
        <div className="shrink-0 flex flex-col items-center md:items-end justify-center">
          <div className={`rounded-2xl border px-6 py-4 text-center shadow-lg backdrop-blur-sm ${scoreColorClass}`}>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 block">
              Data Quality Score
            </span>
            <div className="text-4xl font-black tracking-tight mt-1">
              {score}%
            </div>
            {/* Progress Bar */}
            <div className="mt-2.5 h-2 w-36 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressGaugeColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Records Card */}
        <button
          onClick={() => handleSelectMetric("ALL_ISSUES")}
          className={`rounded-xl border p-4 text-left transition-all shadow-sm ${
            activeMetricKey === "ALL_ISSUES"
              ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Records</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{overview.totalRecords}</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
            <span>{overview.metrics.ALL_ISSUES} with issues</span>
          </div>
        </button>

        {/* 9 Specific Defect Metrics */}
        {overview.metricSummaries.map((metric) => {
          const isSelected = activeMetricKey === metric.key;
          const hasIssues = metric.count > 0;

          return (
            <button
              key={metric.key}
              onClick={() => handleSelectMetric(metric.key)}
              className={`rounded-xl border p-4 text-left transition-all shadow-sm ${
                isSelected
                  ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="truncate pr-1">{metric.label}</span>
                {hasIssues ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
              </div>
              <p
                className={`mt-2 text-2xl font-black ${
                  hasIssues ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {metric.count}
              </p>
              <p className="mt-1 text-[10px] text-slate-500 truncate" title={metric.description}>
                {metric.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Affected Publications Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 p-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">
                {activeMetricKey === "ALL_ISSUES"
                  ? "All Publications with Data Quality Issues"
                  : `Affected Publications — ${overview.metricSummaries.find((m) => m.key === activeMetricKey)?.label || activeMetricKey}`}
              </h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                {affectedList.length} Records
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Click &quot;Fix Issue&quot; on any publication to open the correction form. All updates are logged in AuditLog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search publications..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-56 rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshData}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              No Quality Issues Found
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {activeMetricKey === "ALL_ISSUES"
                ? "All publications meet institutional data quality standards."
                : `No publications currently fail the ${activeMetricKey.replace(/_/g, " ")} check.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3">Publication</th>
                  <th scope="col" className="px-4 py-3">Department</th>
                  <th scope="col" className="px-4 py-3">Faculty</th>
                  <th scope="col" className="px-4 py-3">Detected Issues</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Publication Details */}
                    <td className="px-4 py-3 max-w-md">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {item.publicationType.replace("_", " ")}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                            {item.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                            {item.doi ? (
                              <span className="font-mono text-slate-600">DOI: {item.doi}</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">No DOI</span>
                            )}
                            <span>•</span>
                            <span>Quartile: {item.quartile}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        <span>{item.department.code}</span>
                      </span>
                    </td>

                    {/* Faculty */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-800">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.faculty.name || item.faculty.email}</span>
                      </div>
                    </td>

                    {/* Detected Issues Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.issues.map((msg, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200"
                          >
                            {msg}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DataQualityFixModal
                          publication={item}
                          departments={departments}
                          activeMetricKey={activeMetricKey}
                          onSuccess={handleRefreshData}
                        />

                        <Link
                          href={`/admin/publications/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
