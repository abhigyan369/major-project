"use client";

import React, { useState, useTransition } from "react";
import { adminArchivePublicationAction, adminRestorePublicationAction, adminDeletePublicationAction } from "@/server/actions/publication.actions";
import { Archive, RotateCcw, Trash2, AlertTriangle, ShieldAlert, Loader2, X, Check } from "lucide-react";

interface AdminDeleteArchiveModalProps {
  publicationId: string;
  title: string;
  currentStatus: string;
  hasApprovalsOrDependencies?: boolean;
  onSuccess?: () => void;
}

export function AdminDeleteArchiveModal({
  publicationId,
  title,
  currentStatus,
  hasApprovalsOrDependencies = false,
  onSuccess,
}: AdminDeleteArchiveModalProps) {
  const [activeAction, setActiveAction] = useState<"archive" | "restore" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isArchived = currentStatus === "ARCHIVED";
  const preservesHistoricalReporting =
    currentStatus === "APPROVED" ||
    currentStatus === "PUBLISHED" ||
    currentStatus === "REJECTED" ||
    hasApprovalsOrDependencies;

  const openModal = (action: "archive" | "restore" | "delete") => {
    setErrorMsg(null);
    setReason("");
    setActiveAction(action);
  };

  const closeModal = () => {
    if (isPending) return;
    setActiveAction(null);
    setReason("");
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeAction === "archive" && !reason.trim()) {
      setErrorMsg("An archival reason is required for administrative audit logs.");
      return;
    }

    startTransition(async () => {
      try {
        if (activeAction === "archive") {
          await adminArchivePublicationAction(publicationId, reason);
        } else if (activeAction === "restore") {
          await adminRestorePublicationAction(publicationId);
        } else if (activeAction === "delete") {
          await adminDeletePublicationAction(publicationId);
        }
        closeModal();
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Operation failed. Please try again.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isArchived ? (
          <button
            type="button"
            onClick={() => openModal("restore")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-500 transition-all shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openModal("archive")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-500 transition-all shrink-0"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Archive</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => openModal("delete")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-900/10 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-600 hover:text-white transition-all shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {activeAction === "archive" && <Archive className="h-5 w-5 text-purple-400" />}
                  {activeAction === "restore" && <RotateCcw className="h-5 w-5 text-blue-400" />}
                  {activeAction === "delete" && <ShieldAlert className="h-5 w-5 text-red-400" />}
                  <h3 className="text-base font-bold tracking-tight text-white">
                    {activeAction === "archive" && "Soft Delete / Archive Publication"}
                    {activeAction === "restore" && "Restore Archived Publication"}
                    {activeAction === "delete" && "Permanent Record Deletion"}
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400 truncate max-w-md">
                  Target: <span className="text-slate-200 font-medium">{title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeAction === "archive" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-3 text-xs text-purple-300">
                    <p className="font-bold flex items-center gap-1">
                      <Archive className="h-4 w-4 text-purple-400" />
                      <span>Soft Deletion & Institutional Compliance</span>
                    </p>
                    <p className="mt-1 text-[11px] text-purple-200/80">
                      Archiving removes the record from default active publication lists while preserving historical reporting, audit logs, and faculty metrics.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Archival Reason / Justification (Required)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Duplicate submission or retracted by journal."
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {activeAction === "restore" && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-xs text-blue-300 space-y-1">
                  <p className="font-bold">Restore Record to Active Pipeline</p>
                  <p className="text-[11px] text-blue-200/80">
                    This publication will be unarchived and placed back into <span className="font-bold text-white font-mono">SUBMITTED</span> status for administrative evaluation.
                  </p>
                </div>
              )}

              {activeAction === "delete" && (
                <div className="space-y-3">
                  {preservesHistoricalReporting ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-950/50 p-4 text-xs text-red-300 space-y-2">
                      <p className="font-bold flex items-center gap-1.5 text-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <span>Permanent Deletion Prohibited by Business Rules</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-red-200/90">
                        This publication has associated approvals, institutional reviews, or approved/published status (<span className="font-bold uppercase">{currentStatus}</span>).
                        Institutional compliance rules require preserving historical reporting data.
                      </p>
                      <p className="text-[11px] font-bold text-amber-300 pt-1">
                        Please close this dialog and select <span className="underline">Soft Delete / Archive</span> instead.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span>Warning: Permanent Deletion</span>
                      </p>
                      <p className="text-[11px] text-red-200/80">
                        This action cannot be undone. This early-stage submission (<span className="font-bold uppercase font-mono">{currentStatus}</span>) will be permanently purged from the database, and an audit log event will record the deletion.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>

                {activeAction === "delete" && preservesHistoricalReporting ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("archive");
                      setErrorMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-500 transition-all"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Switch to Archive Instead</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow transition-all ${
                      activeAction === "archive"
                        ? "bg-purple-600 text-white hover:bg-purple-500"
                        : activeAction === "restore"
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-red-600 text-white hover:bg-red-500"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>
                          Confirm {activeAction === "archive" ? "Archival" : activeAction === "restore" ? "Restoration" : "Permanent Delete"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
