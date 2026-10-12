import React from "react";
import { requireAdmin } from "@/lib/auth-helpers";
import db from "@/lib/db";
import { AdminReportsClient } from "@/components/admin/reports/admin-reports-client";

export const revalidate = 0; // Dynamic server rendering

export default async function AdminReportsPage() {
  await requireAdmin();

  // Load options for report filter dropdowns
  const [departments, campuses, facultyUsers, publications] = await Promise.all([
    db.department.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    db.campus.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    db.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.publication.findMany({
      select: { publicationDate: true, createdAt: true },
    }),
  ]);

  const yearsSet = new Set<string>();
  publications.forEach((p) => {
    const d = p.publicationDate || p.createdAt;
    if (d) {
      yearsSet.add(new Date(d).getFullYear().toString());
    }
  });

  if (!yearsSet.has("2026")) yearsSet.add("2026");
  if (!yearsSet.has("2025")) yearsSet.add("2025");

  const availableYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));

  const filterOptions = {
    years: availableYears,
    departments,
    campuses,
    faculty: facultyUsers.map((f) => ({ id: f.id, name: f.name || f.email, email: f.email })),
  };

  return <AdminReportsClient options={filterOptions} />;
}
