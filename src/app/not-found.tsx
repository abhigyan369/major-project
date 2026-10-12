import React from "react";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm border border-amber-200 mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900">404 — Page Not Found</h1>
      <p className="mt-2 max-w-md text-xs text-slate-600 leading-relaxed">
        The requested resource or page does not exist or has been relocated within the NIE Publication Portal.
      </p>

      <div className="mt-6">
        <Link
          href="/user/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
