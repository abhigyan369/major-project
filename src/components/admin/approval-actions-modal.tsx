"use client";

import React, { useState, useTransition } from "react";
import {
  approvePublicationAction,
  rejectPublicationAction,
  requestChangesAction,
} from "@/server/actions/publication.actions";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, MessageSquare, X } from "lucide-react";
import { useToast } from "@/components/shared/toast-provider";

interface ApprovalActionsModalProps {
  publicationId: string;
  title: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function ApprovalActionsModal({
  publicationId,
  title,
  currentStatus,
  onSuccess,
}: ApprovalActionsModalProps) {
  const [activeModal, setActiveModal] = useState<"approve" | "request_changes" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toast = useToast();

  const openModal = (type: "approve" | "request_changes" | "reject") => {
    setErrorMsg(null);
    setComment("");
    setActiveModal(type);
  };

  const closeModal = () => {
    if (isPending) return;
    setActiveModal(null);
    setComment("");
    setErrorMsg(null);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if ((activeModal === "request_changes" || activeModal === "reject") && !comment.trim()) {
      setErrorMsg(
        activeModal === "request_changes"
          ? "An admin comment is required (e.g., 'Please upload the acceptance letter.')."
          : "A rejection reason is required."
      );
      return;
    }

    const currentAction = activeModal;

    startTransition(async () => {
      try {
        if (currentAction === "approve") {
          await approvePublicationAction(publicationId, comment || "Approved by Administrator");
          toast.success("Publication Approved", `"${title}" has been approved.`);
        } else if (currentAction === "request_changes") {
          await requestChangesAction(publicationId, comment);
          toast.warning("Changes Requested", `Revision request sent for "${title}".`);
        } else if (currentAction === "reject") {
          await rejectPublicationAction(publicationId, comment);
          toast.error("Publication Rejected", `"${title}" has been marked as rejected.`);
        }

        closeModal();
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Action failed. Please try again.";
        setErrorMsg(msg);
        toast.error("Action Failed", msg);
      }
    });
  };

  return (
    <>
      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openModal("approve")}
          disabled={currentStatus === "APPROVED" || currentStatus === "PUBLISHED" || isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-40 transition-all"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Approve</span>
        </button>

        <button
          type="button"
          onClick={() => openModal("request_changes")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 disabled:opacity-40 transition-all"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Request Changes</span>
        </button>

        <button
          type="button"
          onClick={() => openModal("reject")}
          disabled={currentStatus === "REJECTED" || isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-40 transition-all"
        >
          <XCircle className="h-4 w-4" />
          <span>Reject</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {activeModal === "approve" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {activeModal === "request_changes" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                  {activeModal === "reject" && <XCircle className="h-5 w-5 text-red-400" />}
                  <h3 className="text-base font-bold tracking-tight">
                    {activeModal === "approve" && "Approve Publication"}
                    {activeModal === "request_changes" && "Request Revisions from Author"}
                    {activeModal === "reject" && "Reject Publication"}
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

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    {activeModal === "approve"
                      ? "Approval Comment (Optional)"
                      : activeModal === "request_changes"
                      ? "Admin Comment / Required Changes (Required)"
                      : "Rejection Reason (Required)"}
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    activeModal === "approve"
                      ? "e.g. Approved for institutional indexing."
                      : activeModal === "request_changes"
                      ? "e.g. Please upload the acceptance letter."
                      : "e.g. Does not meet minimum Scopus quartile requirements."
                  }
                  required={activeModal !== "approve"}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
                {activeModal === "request_changes" && (
                  <p className="mt-1 text-[11px] text-amber-400 font-medium">
                    Publication status will change to <span className="font-bold">REVISION_REQUIRED</span>. Submitter will be notified.
                  </p>
                )}
                {activeModal === "reject" && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">
                    Publication status will change to <span className="font-bold">REJECTED</span>. Submitter will be notified.
                  </p>
                )}
                {activeModal === "approve" && (
                  <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                    Publication status will change to <span className="font-bold">APPROVED</span>. Submitter will be notified.
                  </p>
                )}
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
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow transition-all ${
                    activeModal === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : activeModal === "request_changes"
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      : "bg-red-600 text-white hover:bg-red-500"
                  }`}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      Confirm {activeModal === "approve" ? "Approval" : activeModal === "request_changes" ? "Request Changes" : "Rejection"}
                    </span>
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
