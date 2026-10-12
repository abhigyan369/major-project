"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Building2,
  Award,
  ShieldCheck,
  BookOpen,
  Target,
} from "lucide-react";

const COLORS = [
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#64748b", // Slate
];

interface AnalyticsChartsProps {
  chartsData: {
    publicationsByYear: { year: string; count: number }[];
    publicationsByDepartment: { code: string; count: number }[];
    publicationStatus: { name: string; rawStatus: string; value: number }[];
    scopusQuartile: { quartile: string; count: number }[];
    webOfScienceBreakdown: { category: string; value: number }[];
    publicationTypeBreakdown: { type: string; rawType: string; count: number }[];
    researchAreas: { area: string; count: number }[];
    departmentTargetPerformance: {
      code: string;
      target: number;
      actual: number;
      achievementPct: number;
    }[];
  };
}

export function AnalyticsCharts({ chartsData }: AnalyticsChartsProps) {
  const {
    publicationsByYear,
    publicationsByDepartment,
    publicationStatus,
    scopusQuartile,
    webOfScienceBreakdown,
    publicationTypeBreakdown,
    researchAreas,
    departmentTargetPerformance,
  } = chartsData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Publications By Year (Trend Chart) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Publications by Year</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Historical Output Trend</span>
        </div>
        <div className="h-64 w-full">
          {publicationsByYear.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={publicationsByYear} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Publications"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f59e0b" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Department Target vs Actual Performance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Department Target vs Actual</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Formula: Target = Faculty × Multiplier</span>
        </div>
        <div className="h-64 w-full">
          {departmentTargetPerformance.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentTargetPerformance} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="target" name="Target Output" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Published" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Publications by Department */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Publications by Department</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Departmental Volume</span>
        </div>
        <div className="h-64 w-full">
          {publicationsByDepartment.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={publicationsByDepartment} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="count" name="Publications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Publication Status Distribution (Donut) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Publication Status Workflow</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Lifecycle Breakdown</span>
        </div>
        <div className="h-64 w-full">
          {publicationStatus.every((s) => s.value === 0) ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={publicationStatus.filter((s) => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {publicationStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Scopus Quartile Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Scopus Quartile Quality Index</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Q1 to Q4 Quality Distribution</span>
        </div>
        <div className="h-64 w-full">
          {scopusQuartile.every((q) => q.count === 0) ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopusQuartile} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="quartile" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="count" name="Publications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6. Web of Science Indexing */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Web of Science Indexing</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">WoS Indexed vs Non-Indexed</span>
        </div>
        <div className="h-64 w-full">
          {webOfScienceBreakdown.every((w) => w.value === 0) ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={webOfScienceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#cbd5e1" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 7. Publication Type Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Publication Type Breakdown</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Journals, Conferences & Books</span>
        </div>
        <div className="h-64 w-full">
          {publicationTypeBreakdown.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={publicationTypeBreakdown} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="count" name="Publications" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 8. Top Research Areas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">Top Research Areas</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Institutional Focus</span>
        </div>
        <div className="h-64 w-full">
          {researchAreas.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={researchAreas}
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <YAxis dataKey="area" type="category" tick={{ fontSize: 9, fill: "#334155" }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="count" name="Publications" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 text-slate-400">
      <BarChart3 className="h-8 w-8 text-slate-300 mb-2" />
      <p className="text-xs font-semibold text-slate-600">No Chart Data Available</p>
      <p className="text-[11px] text-slate-400 mt-0.5">Adjust filter criteria to view metrics.</p>
    </div>
  );
}
