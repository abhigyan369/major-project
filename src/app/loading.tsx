import React from "react";
import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-500">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-slate-800" />
      </div>
      <h3 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
        Loading NIE Portal...
      </h3>
    </div>
  );
}
