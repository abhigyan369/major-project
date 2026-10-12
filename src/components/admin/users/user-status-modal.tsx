"use client";

import React, { useState, useTransition } from "react";
import { X, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { UserStatus } from "@prisma/client";
import { toggleUserStatusAction } from "@/server/actions/user-admin.actions";
import { UserItem } from "./user-table";

interface UserStatusModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserStatusModal({ user, isOpen, onClose }: UserStatusModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isDeactivating = user.status === UserStatus.ACTIVE;
  const newStatus = isDeactivating ? UserStatus.INACTIVE : UserStatus.ACTIVE;

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await toggleUserStatusAction({
        userId: user!.id,
        status: newStatus,
      });

      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Failed to update user status");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isDeactivating ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {isDeactivating ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isDeactivating ? "Deactivate User Account" : "Reactivate User Account"}
              </h2>
              <p className="text-xs text-slate-500">Confirm account status modification</p>
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

        <div className="text-xs text-slate-600 space-y-2 mb-6">
          <p>
            Are you sure you want to{" "}
            <span className="font-bold text-slate-900">
              {isDeactivating ? "deactivate" : "reactivate"}
            </span>{" "}
            the account for <span className="font-bold text-slate-900">{user.name || user.email}</span>?
          </p>
          {isDeactivating ? (
            <p className="text-slate-500">
              Deactivating this account will prevent the user from logging in or submitting publications until reactivated.
            </p>
          ) : (
            <p className="text-slate-500">
              Reactivating this account will restore full portal access for this user.
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
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow disabled:opacity-50 transition-all ${
              isDeactivating ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Confirm {isDeactivating ? "Deactivation" : "Reactivation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
