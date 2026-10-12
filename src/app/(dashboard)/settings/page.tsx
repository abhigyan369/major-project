import React from "react";
import { Database, Key } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          System Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Infrastructure configurations, database parameters, Auth.js parameters, and institutional settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Config */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-800">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">PostgreSQL Connection</h3>
              <p className="text-xs text-slate-500">Prisma ORM engine parameters</p>
            </div>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Host:</span>
              <span className="font-semibold text-slate-800">localhost:5433</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Database Name:</span>
              <span className="font-semibold text-slate-800">nie_publications</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Auth.js Config */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-800">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Auth.js v5 Configuration</h3>
              <p className="text-xs text-slate-500">Session and RBAC security layer</p>
            </div>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Secret Configured:</span>
              <span className="font-semibold text-emerald-700">Yes (AUTH_SECRET)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Adapter:</span>
              <span className="font-semibold text-slate-800">@auth/prisma-adapter</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Phase 1 Status:</span>
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Foundation Initialized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
