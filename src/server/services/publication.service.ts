import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma, PublicationStatus, ScopusQuartile, PublicationType } from "@prisma/client";

export async function getPublicationStats() {
  try {
    const totalCount = await db.publication.count();
    const publishedCount = await db.publication.count({
      where: { status: "PUBLISHED" },
    });
    const acceptedCount = await db.publication.count({
      where: { status: "APPROVED" },
    });
    const pipelineCount = await db.publication.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"] },
      },
    });
    const q1Q2Count = await db.publication.count({
      where: {
        quartile: { in: ["Q1", "Q2"] },
      },
    });
    const wosCount = await db.publication.count({
      where: { isWebOfScience: true },
    });

    return {
      totalCount,
      publishedCount,
      acceptedCount,
      pipelineCount,
      q1Q2Count,
      wosCount,
    };
  } catch (error) {
    logger.error("Failed to fetch publication stats", error);
    throw error;
  }
}

export async function getRecentPublications(limit = 5) {
  try {
    const publications = await db.publication.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        journal: true,
        authors: {
          include: {
            user: true,
          },
        },
      },
    });
    return publications;
  } catch (error) {
    logger.error("Failed to fetch recent publications", error);
    throw error;
  }
}

export interface AdminPublicationQueryParams {
  search?: string;
  departmentId?: string;
  campusId?: string;
  facultyId?: string;
  status?: string;
  quartile?: string;
  publicationType?: string;
  year?: string;
  isWebOfScience?: string;
  isScopus?: string;
  sortBy?: "createdAt" | "publicationDate" | "title" | "impactFactor" | "citationCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function getAdminPublications(params: AdminPublicationQueryParams) {
  try {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PublicationWhereInput = {};

    // Search term across title, doi, venueName, journal.name, createdBy, and author names
    if (params.search && params.search.trim()) {
      const query = params.search.trim();
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { doi: { contains: query, mode: "insensitive" } },
        { venueName: { contains: query, mode: "insensitive" } },
        { journal: { name: { contains: query, mode: "insensitive" } } },
        { createdBy: { name: { contains: query, mode: "insensitive" } } },
        { createdBy: { email: { contains: query, mode: "insensitive" } } },
        { authors: { some: { authorName: { contains: query, mode: "insensitive" } } } },
      ];
    }

    // Department filter
    if (params.departmentId && params.departmentId !== "ALL") {
      where.departmentId = params.departmentId;
    }

    // Campus filter
    if (params.campusId && params.campusId !== "ALL") {
      where.department = { campusId: params.campusId };
    }

    // Faculty / Submitter filter
    if (params.facultyId && params.facultyId !== "ALL") {
      where.OR = [
        ...(where.OR || []),
        { createdById: params.facultyId },
        { authors: { some: { userId: params.facultyId } } },
      ];
    }

    // Status filter
    if (params.status && params.status !== "ALL") {
      where.status = params.status as PublicationStatus;
    }

    // Quartile filter
    if (params.quartile && params.quartile !== "ALL") {
      where.quartile = params.quartile as ScopusQuartile;
    }

    // Publication Type filter
    if (params.publicationType && params.publicationType !== "ALL") {
      where.publicationType = params.publicationType as PublicationType;
    }

    // Web of Science filter
    if (params.isWebOfScience === "true") {
      where.isWebOfScience = true;
    } else if (params.isWebOfScience === "false") {
      where.isWebOfScience = false;
    }

    // Scopus filter
    if (params.isScopus === "true") {
      where.isScopus = true;
    } else if (params.isScopus === "false") {
      where.isScopus = false;
    }

    // Year filter
    if (params.year && params.year !== "ALL") {
      const yearNum = parseInt(params.year, 10);
      if (!isNaN(yearNum)) {
        const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${yearNum}-12-31T23:59:59.999Z`);
        where.OR = [
          { publicationDate: { gte: startDate, lte: endDate } },
          { submissionDate: { gte: startDate, lte: endDate } },
          { createdAt: { gte: startDate, lte: endDate } },
        ];
      }
    }

    // Sorting
    const sortBy = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";
    const orderBy: Prisma.PublicationOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, totalCount] = await Promise.all([
      db.publication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: { include: { campus: true } },
          journal: true,
          createdBy: true,
          authors: {
            orderBy: { authorOrder: "asc" },
            include: { user: true },
          },
          approvals: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { admin: true },
          },
          documents: true,
        },
      }),
      db.publication.count({ where }),
    ]);

    // Fetch dynamic filter options metadata
    const [departments, campuses, faculties] = await Promise.all([
      db.department.findMany({
        include: { campus: true },
        orderBy: { code: "asc" },
      }),
      db.campus.findMany({
        orderBy: { name: "asc" },
      }),
      db.user.findMany({
        select: { id: true, name: true, email: true, designation: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Count stats header
    const [totalPubs, submittedPubs, approvedPubs, publishedPubs, archivedPubs] = await Promise.all([
      db.publication.count(),
      db.publication.count({ where: { status: "SUBMITTED" } }),
      db.publication.count({ where: { status: "APPROVED" } }),
      db.publication.count({ where: { status: "PUBLISHED" } }),
      db.publication.count({ where: { status: "ARCHIVED" } }),
    ]);

    return {
      data,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      filterOptions: {
        departments,
        campuses,
        faculties,
      },
      stats: {
        totalPubs,
        submittedPubs,
        approvedPubs,
        publishedPubs,
        archivedPubs,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch admin publications", error);
    throw error;
  }
}

