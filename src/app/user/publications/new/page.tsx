import React from "react";
import { requireUser } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { PublicationForm } from "@/components/publications/publication-form";
import { PlusCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewPublicationPage() {
  const user = await requireUser();

  const departments = await db.department.findMany({
    orderBy: { code: "asc" },
  });

  const journals = await db.journal.findMany({
    orderBy: { name: "asc" },
  });

  const researchAreas = await db.researchArea.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/user/publications"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-amber-500" />
            <span>Create New Research Publication</span>
          </h1>
          <p className="text-xs text-slate-500">
            Submit multi-section manuscript details for institutional record, NIRF compliance, and admin review.
          </p>
        </div>
      </div>

      <PublicationForm
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        journals={journals.map((j) => ({ id: j.id, name: j.name, scopusQuartile: j.scopusQuartile }))}
        researchAreas={researchAreas.map((ra) => ({ id: ra.id, name: ra.name }))}
        userDefaultDepartmentId={user.departmentId || undefined}
      />
    </div>
  );
}
