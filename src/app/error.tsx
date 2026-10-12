"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm border border-rose-200 mb-4">
        <AlertOctagon className="h-7 w-7" />
      </div>

      <h1 className="text-xl font-bold text-slate-900">An unexpected system error occurred</h1>
      <p className="mt-2 max-w-md text-xs text-slate-600 leading-relaxed">
        The application encountered an unresolved runtime issue. Please try refreshing the action or return to the main dashboard.
      </p>

      {error.digest && (
        <code className="mt-3 rounded bg-slate-200/70 px-2 py-1 text-[11px] font-mono text-slate-700">
          Error Reference: {error.digest}
        </code>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/user/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Home className="h-3.5 w-3.5 text-slate-500" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
