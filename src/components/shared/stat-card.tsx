import React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  iconName: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  iconName,
  change,
  changeType = "positive",
  className,
}: StatCardProps) {
  const IconComponent = ICON_MAP[iconName] || FileText;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
          <IconComponent className="h-5 w-5 text-slate-700" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold",
              changeType === "positive" && "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100",
              changeType === "negative" && "text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100",
              changeType === "neutral" && "text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
            )}
          >
            {change}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
