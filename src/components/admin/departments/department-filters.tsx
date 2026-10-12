"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, RotateCcw, Plus, Filter } from "lucide-react";

interface DepartmentFiltersProps {
  campuses: Array<{ id: string; code: string; name: string }>;
  totalDepartments: number;
  onOpenCreateModal: () => void;
}

export function DepartmentFilters({
  campuses,
  totalDepartments,
  onOpenCreateModal,
}: DepartmentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const campusId = searchParams.get("campusId") || "ALL";

  function updateParams(newParams: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "ALL" && value.trim() !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search });
  }

  function handleReset() {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters = search.trim() !== "" || campusId !== "ALL";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments by code or name (e.g. CSE, Mechanical)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Create Department Button */}
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Filter Select Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Campus Filter:</span>
        </div>

        <select
          value={campusId}
          onChange={(e) => updateParams({ campusId: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="ALL">All Campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}

        <div className="ml-auto text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-900">{totalDepartments}</span> department(s)
        </div>
      </div>
    </div>
  );
}
