import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import db from "@/lib/db";
import {
  getDataQualityOverview,
  getAffectedPublications,
} from "@/server/services/data-quality.service";
import { DataQualityDashboard } from "@/components/admin/data-quality/data-quality-dashboard";

export const metadata = {
  title: "Data Quality Dashboard | NIE Research Management",
  description: "Administrator data quality auditing and correction module",
};

export default async function AdminDataQualityPage() {
  await requireAdmin();

  const [overview, initialAffected, departments] = await Promise.all([
    getDataQualityOverview(),
    getAffectedPublications("ALL_ISSUES"),
    db.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <DataQualityDashboard
      initialOverview={overview}
      initialAffected={initialAffected}
      departments={departments}
    />
  );
}
