import React from "react";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionHref,
  actionLabel,
  onActionClick,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 sm:p-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-sm mb-4">
        <Icon className="h-6 w-6 stroke-1 text-slate-500" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              onClick={onActionClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
