import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAnalyticsData } from "@/server/services/analytics.service";
import { AdminAnalyticsClient } from "@/components/admin/analytics/admin-analytics-client";

export const revalidate = 0; // Dynamic server rendering

export default async function AdminAnalyticsPage() {
  // Ensure Admin authentication
  await requireAdmin();

  // Load initial analytics data from PostgreSQL
  const initialData = await getAnalyticsData();

  return <AdminAnalyticsClient initialData={initialData} />;
}
