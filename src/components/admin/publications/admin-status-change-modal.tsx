"use client";

import React, { useState, useTransition } from "react";
import { PublicationStatus } from "@prisma/client";
import { adminChangeStatusAction } from "@/server/actions/publication.actions";
import { RefreshCw, MessageSquare, Loader2, X, CheckCircle2, ShieldCheck } from "lucide-react";

interface AdminStatusChangeModalProps {
  publicationId: string;
  title: string;
  currentStatus: PublicationStatus | string;
  onSuccess?: () => void;
}

export function AdminStatusChangeModal({
  publicationId,
  title,
  currentStatus,
  onSuccess,
}: AdminStatusChangeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PublicationStatus>(
    (currentStatus as PublicationStatus) || PublicationStatus.SUBMITTED
  );
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openModal = () => {
    setErrorMsg(null);
    setComment("");
    setSelectedStatus((currentStatus as PublicationStatus) || PublicationStatus.SUBMITTED);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isPending) return;
    setIsOpen(false);
    setComment("");
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!comment.trim()) {
      setErrorMsg("A justification/comment is required for audit trail purposes.");
      return;
    }

    startTransition(async () => {
      try {
        await adminChangeStatusAction(publicationId, selectedStatus, comment);
        closeModal();
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Status change failed. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all shrink-0"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Change Status</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Administrative Lifecycle Transition
                  </h3>
                </div>
                <p className="mt-1 text-xs text-slate-400 truncate max-w-md">
                  Publication: <span className="text-slate-200 font-medium">{title}</span>
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
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Lifecycle Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as PublicationStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="ARCHIVED">ARCHIVED (Soft Deleted)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Current Status: <span className="font-bold text-amber-400">{currentStatus}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span>Audit Trail Comment / Justification (Required)</span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Verified Scopus indexing and compliance with department targets. Transitioning to APPROVED status."
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

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

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition-all disabled:opacity-40"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating Status...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Execute Transition & Audit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
