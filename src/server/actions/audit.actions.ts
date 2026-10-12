"use server";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAuditLogsAction(options?: {
  page?: number;
  limit?: number;
  search?: string;
  actionType?: string;
}) {
  await requireAdmin();

  const page = options?.page || 1;
  const limit = options?.limit || 25;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options?.search) {
    where.OR = [
      { entityType: { contains: options.search, mode: "insensitive" } },
      { entityId: { contains: options.search, mode: "insensitive" } },
      { user: { name: { contains: options.search, mode: "insensitive" } } },
      { user: { email: { contains: options.search, mode: "insensitive" } } },
    ];
  }

  if (options?.actionType && options.actionType !== "ALL") {
    where.action = options.actionType;
  }

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    success: true,
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}
