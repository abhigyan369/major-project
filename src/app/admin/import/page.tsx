import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getImportBatchHistory } from "@/server/services/excel-import.service";
import { AdminImportClient } from "@/components/admin/import/admin-import-client";

export default async function AdminImportPage() {
  await requireAdmin();

  const history = await getImportBatchHistory();

  // Convert Date objects to strings for Client Component serialization
  const serializedHistory = history.map((batch: any) => ({
    ...batch,
    createdAt: batch.createdAt.toISOString(),
  }));

  return <AdminImportClient initialHistory={serializedHistory} />;
}
