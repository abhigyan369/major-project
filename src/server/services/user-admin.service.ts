import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

export interface GetAdminUsersParams {
  search?: string;
  departmentId?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getAdminUsers(params: GetAdminUsersParams = {}) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.departmentId && params.departmentId !== "ALL") {
      where.departmentId = params.departmentId;
    }

    if (params.role && params.role !== "ALL") {
      where.role = params.role as UserRole;
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status as UserStatus;
    }

    const [users, totalCount, totalUsers, activeUsers, adminUsers, inactiveUsers] =
      await Promise.all([
        db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            department: {
              include: {
                campus: true,
              },
            },
            _count: {
              select: {
                publicationsCreated: true,
                authorships: true,
              },
            },
          },
        }),
        db.user.count({ where }),
        db.user.count(),
        db.user.count({ where: { status: UserStatus.ACTIVE } }),
        db.user.count({ where: { role: UserRole.ADMIN } }),
        db.user.count({
          where: {
            status: { in: [UserStatus.INACTIVE, UserStatus.SUSPENDED] },
          },
        }),
      ]);

    const departments = await db.department.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return {
      users,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      limit,
      departments,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers,
      },
    };
  } catch (error) {
    logger.error("Failed to get admin users list", error);
    throw error;
  }
}

export async function getUserDetailsById(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            campus: true,
          },
        },
        publicationsCreated: {
          orderBy: { createdAt: "desc" },
          include: {
            department: true,
            journal: true,
            authors: true,
          },
        },
        authorships: {
          orderBy: { createdAt: "desc" },
          include: {
            publication: {
              include: {
                department: true,
                journal: true,
              },
            },
          },
        },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Calculate aggregated metrics for the user
    const createdPubs = user.publicationsCreated || [];
    const totalPublications = createdPubs.length;
    const approvedOrPublished = createdPubs.filter(
      (p) => p.status === "APPROVED" || p.status === "PUBLISHED"
    ).length;
    const scopusCount = createdPubs.filter((p) => p.isScopus).length;
    const wosCount = createdPubs.filter((p) => p.isWebOfScience).length;

    return {
      user,
      stats: {
        totalPublications,
        approvedOrPublished,
        scopusCount,
        wosCount,
      },
    };
  } catch (error) {
    logger.error(`Failed to get user details for ID: ${userId}`, error);
    throw error;
  }
}
