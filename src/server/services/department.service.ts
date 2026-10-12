import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export interface GetAdminDepartmentsParams {
  search?: string;
  campusId?: string;
}

export async function getAllDepartments() {
  try {
    const departments = await db.department.findMany({
      orderBy: { code: "asc" },
      include: {
        campus: true,
        _count: {
          select: {
            users: true,
            publications: true,
          },
        },
      },
    });
    return departments;
  } catch (error) {
    logger.error("Failed to fetch departments", error);
    throw error;
  }
}

export async function getAdminDepartments(params: GetAdminDepartmentsParams = {}) {
  try {
    const where: Prisma.DepartmentWhereInput = {};

    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    if (params.campusId && params.campusId !== "ALL") {
      where.campusId = params.campusId;
    }

    const [departments, campuses, totalPubsCount] = await Promise.all([
      db.department.findMany({
        where,
        orderBy: { code: "asc" },
        include: {
          campus: true,
          _count: {
            select: {
              users: true,
              publications: true,
            },
          },
        },
      }),
      db.campus.findMany({
        orderBy: { code: "asc" },
      }),
      db.publication.count(),
    ]);

    // Calculate aggregated KPIs across departments
    const totalDepartments = departments.length;
    const totalFaculty = departments.reduce((acc, d) => acc + d.facultyCount, 0);
    const totalAnnualTarget = departments.reduce(
      (acc, d) => acc + Math.round(d.facultyCount * d.targetPerFaculty),
      0
    );
    const activeDepartments = departments.filter((d) => d.isActive).length;

    return {
      departments,
      campuses,
      stats: {
        totalDepartments,
        activeDepartments,
        totalFaculty,
        totalAnnualTarget,
        totalPubsCount,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch admin departments", error);
    throw error;
  }
}

export async function getCampuses() {
  try {
    return await db.campus.findMany({
      orderBy: { code: "asc" },
    });
  } catch (error) {
    logger.error("Failed to fetch campuses", error);
    throw error;
  }
}

export async function getDepartmentByCode(code: string) {
  try {
    const department = await db.department.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        users: true,
        _count: {
          select: { publications: true },
        },
      },
    });
    return department;
  } catch (error) {
    logger.error(`Failed to fetch department with code ${code}`, error);
    throw error;
  }
}
