import React from "react";
import { cn } from "@/lib/utils";
import { PublicationStatus, ScopusQuartile } from "@prisma/client";

interface StatusBadgeProps {
  status?: PublicationStatus | string;
  quartile?: ScopusQuartile | string;
  isWos?: boolean;
  className?: string;
}

export function StatusBadge({ status, quartile, isWos, className }: StatusBadgeProps) {
  if (isWos) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200",
          className
        )}
      >
        WoS Indexed
      </span>
    );
  }

  if (quartile) {
    const quartileStyles: Record<string, string> = {
      Q1: "bg-emerald-100 text-emerald-800 border-emerald-300",
      Q2: "bg-blue-100 text-blue-800 border-blue-300",
      Q3: "bg-amber-100 text-amber-800 border-amber-300",
      Q4: "bg-orange-100 text-orange-800 border-orange-300",
      UNSPECIFIED: "bg-slate-100 text-slate-700 border-slate-200",
      NOT_SCOPUS: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
          quartileStyles[quartile] || quartileStyles.UNSPECIFIED,
          className
        )}
      >
        {quartile}
      </span>
    );
  }

  if (status) {
    const statusStyles: Record<string, string> = {
      PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      ACCEPTED: "bg-teal-50 text-teal-700 border-teal-200",
      UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
      REVISION_REQUIRED: "bg-amber-50 text-amber-700 border-amber-200",
      SUBMITTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
      REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
    };

    const formattedLabel = status.replace(/_/g, " ");

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border capitalize",
          statusStyles[status] || "bg-slate-100 text-slate-700 border-slate-200",
          className
        )}
      >
        {formattedLabel}
      </span>
    );
  }

  return null;
}
