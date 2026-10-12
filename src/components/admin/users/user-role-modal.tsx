"use client";

import React, { useState, useTransition } from "react";
import { X, ShieldAlert, Loader2, Shield } from "lucide-react";
import { UserRole } from "@prisma/client";
import { changeUserRoleAction } from "@/server/actions/user-admin.actions";
import { UserItem } from "./user-table";

interface UserRoleModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserRoleModal({ user, isOpen, onClose }: UserRoleModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isCurrentAdmin = user.role === UserRole.ADMIN;
  const newRole = isCurrentAdmin ? UserRole.USER : UserRole.ADMIN;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await changeUserRoleAction({
        userId: user!.id,
        role: newRole,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to change user role");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Authorization Role</h2>
              <p className="text-xs text-slate-500">Modify system access permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="text-xs text-slate-600 space-y-3 mb-6">
          <p>
            You are changing the system authorization role for{" "}
            <span className="font-bold text-slate-900">{user.name || user.email}</span>.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Current Role</span>
              <span className="font-bold text-slate-800">{user.role}</span>
            </div>
            <div className="text-amber-500 font-black text-sm">→</div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">New Role</span>
              <span className="font-bold text-amber-600 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {newRole}
              </span>
            </div>
          </div>
          {newRole === UserRole.ADMIN ? (
            <p className="text-amber-700 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
              Granting ADMIN privileges gives this user full administrative control over all publications, users, departments, and audit logs across NIE Mysuru.
            </p>
          ) : (
            <p className="text-slate-500">
              Revoking ADMIN role will restrict this account to standard faculty/scholar portal permissions.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-50 transition-all"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Confirm Role Change</span>
          </button>
        </div>
      </div>
    </div>
  );
}
