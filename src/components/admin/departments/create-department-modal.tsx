"use client";

import React, { useState, useTransition } from "react";
import { X, Building2, AlertCircle, Loader2 } from "lucide-react";
import { createDepartmentAction } from "@/server/actions/department.actions";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  campuses: Array<{ id: string; code: string; name: string }>;
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  campuses,
}: CreateDepartmentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [campusId, setCampusId] = useState(campuses[0]?.id || "");
  const [facultyCount, setFacultyCount] = useState(30);
  const [targetPerFaculty, setTargetPerFaculty] = useState(3.0);
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createDepartmentAction({
        code,
        name,
        campusId,
        facultyCount: Number(facultyCount),
        targetPerFaculty: Number(targetPerFaculty),
        isActive,
      });

      if (res.success) {
        onClose();
        setCode("");
        setName("");
        setFacultyCount(30);
        setTargetPerFaculty(3.0);
        setIsActive(true);
      } else {
        setError(res.error || "Failed to create department");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Academic Department</h2>
              <p className="text-xs text-slate-500">Define code, campus mapping, faculty count, and targets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. AI-DS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 uppercase"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus *</label>
              <select
                required
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Department of Artificial Intelligence & Data Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Faculty Count *</label>
              <input
                type="number"
                required
                min={0}
                value={facultyCount}
                onChange={(e) => setFacultyCount(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target / Faculty *</label>
              <input
                type="number"
                step="0.5"
                required
                min={0}
                value={targetPerFaculty}
                onChange={(e) => setTargetPerFaculty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-800">Department Status</span>
              <span className="text-[11px] text-slate-500">Enable or disable department in options</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-all"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Create Department</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
