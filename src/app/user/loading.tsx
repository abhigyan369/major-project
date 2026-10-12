import React from "react";
import { CardSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Content Block Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
