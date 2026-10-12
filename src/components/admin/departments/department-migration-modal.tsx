"use client";

import React, { useState, useTransition } from "react";
import { X, AlertTriangle, Loader2, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { deleteOrMigrateDepartmentAction } from "@/server/actions/department.actions";
import { DepartmentItem } from "./department-table";

interface DepartmentMigrationModalProps {
  department: DepartmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  allDepartments: DepartmentItem[];
}

export function DepartmentMigrationModal({
  department,
  isOpen,
  onClose,
  allDepartments,
}: DepartmentMigrationModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [targetDepartmentId, setTargetDepartmentId] = useState("");

  if (!isOpen || !department) return null;

  const publicationCount = department._count.publications;
  const userCount = department._count.users;
  const hasDependencies = publicationCount > 0 || userCount > 0;

  const availableTargetDepartments = allDepartments.filter((d) => d.id !== department.id);

  function handleConfirmDelete() {
    setError(null);

    if (hasDependencies && !targetDepartmentId) {
      setError("Please select a target department to migrate dependent publications and users before deleting.");
      return;
    }

    startTransition(async () => {
      const res = await deleteOrMigrateDepartmentAction({
        departmentId: department!.id,
        targetDepartmentId: hasDependencies ? targetDepartmentId : null,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to process department deletion.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {hasDependencies ? "Department Migration & Safe Deletion" : "Delete Department"}
              </h2>
              <p className="text-xs text-slate-500">
                {hasDependencies
                  ? "Reassign dependent records before removing department"
                  : "Confirm deletion of empty department"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Dependent Records Callout Banner */}
        {hasDependencies ? (
          <div className="space-y-4 mb-6">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Deletion Safeguard Active</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                Department <span className="font-extrabold">{department.code} ({department.name})</span> currently has:
              </p>
              <div className="flex items-center gap-4 pt-1 font-bold text-amber-950">
                <span className="bg-amber-200/70 px-2.5 py-1 rounded-lg">
                  📄 {publicationCount} Publication(s)
                </span>
                <span className="bg-amber-200/70 px-2.5 py-1 rounded-lg">
                  👥 {userCount} User(s)
                </span>
              </div>
              <p className="text-[11px] text-amber-800 pt-1">
                To prevent orphan records or data loss, all attached publications and users must be migrated to another department.
              </p>
            </div>

            {/* Target Migration Department Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600" />
                <span>Select Target Migration Department *</span>
              </label>
              <select
                required
                value={targetDepartmentId}
                onChange={(e) => setTargetDepartmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Select Destination Department --</option>
                {availableTargetDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name} ({d.campus.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-600 mb-6 space-y-2">
            <p>
              Are you sure you want to delete department{" "}
              <span className="font-bold text-slate-900">{department.code} - {department.name}</span>?
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 font-semibold text-[11px]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Zero publications or users depend on this department. It can be safely deleted.</span>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isPending || (hasDependencies && !targetDepartmentId)}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 disabled:opacity-50 transition-all"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{hasDependencies ? "Migrate Records & Delete Department" : "Delete Department"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
