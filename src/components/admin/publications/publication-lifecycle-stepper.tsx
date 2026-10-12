"use client";

import React from "react";
import { Check, Clock, AlertCircle, FileEdit, CheckCircle2, XCircle, Send, BookCheck, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LifecycleStage {
  id: string;
  label: string;
  sublabel?: string;
  date?: Date | string | null;
  status: "completed" | "current" | "upcoming" | "error" | "warning";
  icon: React.ReactNode;
}

interface PublicationLifecycleStepperProps {
  publicationStatus: string;
  createdAt?: Date | string | null;
  submissionDate?: Date | string | null;
  acceptanceDate?: Date | string | null;
  publicationDate?: Date | string | null;
  latestComment?: string | null;
}

export function PublicationLifecycleStepper({
  publicationStatus,
  createdAt,
  submissionDate,
  acceptanceDate,
  publicationDate,
  latestComment,
}: PublicationLifecycleStepperProps) {
  // Determine lifecycle step index
  // 0: Created
  // 1: Submitted
  // 2: Under Review
  // 3: Decision (Approved / Revision Required / Rejected)
  // 4: Published / Archived

  const isDraft = publicationStatus === "DRAFT";
  const isSubmitted = publicationStatus === "SUBMITTED";
  const isUnderReview = publicationStatus === "UNDER_REVIEW";
  const isRevisionRequired = publicationStatus === "REVISION_REQUIRED";
  const isApproved = publicationStatus === "APPROVED";
  const isRejected = publicationStatus === "REJECTED";
  const isPublished = publicationStatus === "PUBLISHED";
  const isArchived = publicationStatus === "ARCHIVED";

  const stages: LifecycleStage[] = [
    {
      id: "created",
      label: "Created",
      sublabel: "Initial Draft Record",
      date: createdAt,
      status: "completed",
      icon: <FileEdit className="h-4 w-4" />,
    },
    {
      id: "submitted",
      label: "Submitted",
      sublabel: "Faculty Submission",
      date: submissionDate || (isDraft ? null : createdAt),
      status: isDraft ? "upcoming" : "completed",
      icon: <Send className="h-4 w-4" />,
    },
    {
      id: "reviewed",
      label: "Reviewed",
      sublabel: "Under Admin Evaluation",
      status:
        isDraft || isSubmitted
          ? isSubmitted
            ? "current"
            : "upcoming"
          : "completed",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "decision",
      label: isRevisionRequired
        ? "Changes Requested"
        : isRejected
        ? "Rejected"
        : isApproved || isPublished
        ? "Approved"
        : "Approval Decision",
      sublabel: isRevisionRequired
        ? "Awaiting Author Revision"
        : isRejected
        ? "Submission Rejected"
        : isApproved || isPublished
        ? "Institutional Approval"
        : "Pending Admin Decision",
      date: acceptanceDate,
      status: isRevisionRequired
        ? "warning"
        : isRejected
        ? "error"
        : isApproved || isPublished
        ? "completed"
        : isUnderReview
        ? "current"
        : "upcoming",
      icon: isRevisionRequired ? (
        <AlertCircle className="h-4 w-4" />
      ) : isRejected ? (
        <XCircle className="h-4 w-4" />
      ) : isApproved || isPublished ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <ShieldCheck className="h-4 w-4" />
      ),
    },
    {
      id: "published",
      label: isArchived ? "Archived" : "Published",
      sublabel: isArchived ? "Soft Deleted Record" : "Final Published Article",
      date: publicationDate,
      status: isPublished
        ? "completed"
        : isArchived
        ? "warning"
        : "upcoming",
      icon: isArchived ? <AlertCircle className="h-4 w-4" /> : <BookCheck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Publication Lifecycle Timeline</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Current status: <strong className="text-slate-900 uppercase font-mono">{publicationStatus}</strong>
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide border ${
            isApproved || isPublished
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : isRevisionRequired
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : isRejected
              ? "bg-red-100 text-red-800 border-red-300"
              : isArchived
              ? "bg-slate-200 text-slate-700 border-slate-300"
              : "bg-blue-100 text-blue-800 border-blue-300"
          }`}
        >
          {publicationStatus}
        </span>
      </div>

      {/* Stepper Pipeline Graphics */}
      <div className="relative py-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";
            const isWarning = stage.status === "warning";
            const isError = stage.status === "error";

            return (
              <div key={stage.id} className="flex flex-col items-center text-center space-y-2 relative">
                {/* Step Connector Line for MD screens */}
                {idx < stages.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-5 left-[50%] w-full h-0.5 -z-10 ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Node Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all shadow-sm ${
                    isCompleted
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50"
                      : isWarning
                      ? "border-amber-500 bg-amber-50 text-amber-600 ring-4 ring-amber-50"
                      : isError
                      ? "border-red-500 bg-red-50 text-red-600 ring-4 ring-red-50"
                      : isCurrent
                      ? "border-amber-500 bg-amber-500 text-slate-950 ring-4 ring-amber-100 font-bold"
                      : "border-slate-300 bg-slate-50 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : stage.icon}
                </div>

                {/* Labels & Timestamps */}
                <div className="space-y-0.5">
                  <p
                    className={`text-xs font-bold ${
                      isCompleted || isCurrent
                        ? "text-slate-900"
                        : isWarning
                        ? "text-amber-800"
                        : isError
                        ? "text-red-800"
                        : "text-slate-400"
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium max-w-[120px] mx-auto leading-tight">
                    {stage.sublabel}
                  </p>
                  {stage.date && (
                    <p className="text-[10px] text-amber-700 font-semibold font-mono pt-0.5">
                      {formatDate(stage.date)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {latestComment && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Latest Status Note: </span>
            <span className="italic">&quot;{latestComment}&quot;</span>
          </div>
        </div>
      )}
    </div>
  );
}
