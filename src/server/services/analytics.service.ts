import db from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma, PublicationStatus, PublicationType, ScopusQuartile } from "@prisma/client";

export interface AnalyticsFilterParams {
  year?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  campusId?: string;
  facultyId?: string;
  publicationType?: string;
  status?: string;
  scopusQuartile?: string;
  webOfScience?: string; // "ALL" | "INDEXED" | "NON_INDEXED"
  targetPerFaculty?: number;
}

export async function getAnalyticsData(filters: AnalyticsFilterParams = {}) {
  try {
    const {
      year = "ALL",
      startDate,
      endDate,
      departmentId = "ALL",
      campusId = "ALL",
      facultyId = "ALL",
      publicationType = "ALL",
      status = "ALL",
      scopusQuartile = "ALL",
      webOfScience = "ALL",
      targetPerFaculty = 3.0,
    } = filters;

    // Build Prisma `where` query dynamically
    const where: Prisma.PublicationWhereInput = {};

    // Department / Campus filter
    if (departmentId !== "ALL") {
      where.departmentId = departmentId;
    } else if (campusId !== "ALL") {
      where.department = { campusId };
    }

    // Faculty filter
    if (facultyId !== "ALL") {
      where.OR = [
        { createdById: facultyId },
        { correspondingAuthorId: facultyId },
        { authors: { some: { userId: facultyId } } },
      ];
    }

    // Publication Type filter
    if (publicationType !== "ALL" && Object.values(PublicationType).includes(publicationType as PublicationType)) {
      where.publicationType = publicationType as PublicationType;
    }

    // Status filter
    if (status !== "ALL" && Object.values(PublicationStatus).includes(status as PublicationStatus)) {
      where.status = status as PublicationStatus;
    }

    // Scopus Quartile filter
    if (scopusQuartile !== "ALL" && Object.values(ScopusQuartile).includes(scopusQuartile as ScopusQuartile)) {
      where.quartile = scopusQuartile as ScopusQuartile;
    }

    // Web of Science filter
    if (webOfScience === "INDEXED") {
      where.isWebOfScience = true;
    } else if (webOfScience === "NON_INDEXED") {
      where.isWebOfScience = false;
    }

    // Date / Year range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
    } else if (year !== "ALL") {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        const startOfYear = new Date(Date.UTC(yearNum, 0, 1));
        const endOfYear = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
        where.OR = [
          { publicationDate: { gte: startOfYear, lte: endOfYear } },
          { AND: [{ publicationDate: null }, { createdAt: { gte: startOfYear, lte: endOfYear } }] },
        ];
      }
    }

    // Fetch all matching publications with full relations
    const publications = await db.publication.findMany({
      where,
      include: {
        department: {
          include: { campus: true },
        },
        researchArea: true,
        createdBy: true,
        authors: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all departments & campuses for dropdowns & scorecards
    const departments = await db.department.findMany({
      include: { campus: true },
      orderBy: { code: "asc" },
    });

    const campuses = await db.campus.findMany({
      orderBy: { code: "asc" },
    });

    const facultyUsers = await db.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true, email: true, designation: true, departmentId: true },
      orderBy: { name: "asc" },
    });

    // ---------------------------------------------------------
    // 1. KPI CARDS CALCULATION
    // ---------------------------------------------------------
    const totalPublications = publications.length;
    const publishedCount = publications.filter((p) => p.status === PublicationStatus.PUBLISHED).length;
    const approvedCount = publications.filter((p) => p.status === PublicationStatus.APPROVED).length;
    const pendingCount = publications.filter((p) => p.status === PublicationStatus.SUBMITTED).length;
    const underReviewCount = publications.filter((p) => p.status === PublicationStatus.UNDER_REVIEW).length;
    const revisionRequiredCount = publications.filter((p) => p.status === PublicationStatus.REVISION_REQUIRED).length;
    const rejectedCount = publications.filter((p) => p.status === PublicationStatus.REJECTED).length;

    const q1Count = publications.filter((p) => p.quartile === ScopusQuartile.Q1).length;
    const q2Count = publications.filter((p) => p.quartile === ScopusQuartile.Q2).length;
    const q1q2Count = q1Count + q2Count;
    const wosCount = publications.filter((p) => p.isWebOfScience).length;

    const totalCitations = publications.reduce((acc, p) => acc + (p.citationCount || 0), 0);
    const avgCitations = totalPublications > 0 ? Number((totalCitations / totalPublications).toFixed(1)) : 0;

    const kpiData = {
      totalPublications,
      publishedCount,
      approvedCount,
      pendingCount,
      underReviewCount,
      revisionRequiredCount,
      rejectedCount,
      q1Count,
      q2Count,
      q1q2Count,
      wosCount,
      avgCitations,
    };

    // ---------------------------------------------------------
    // 2. CHART VISUALIZATION DATA
    // ---------------------------------------------------------

    // A. Publications by Year
    const yearMap: Record<string, number> = {};
    publications.forEach((p) => {
      const d = p.publicationDate || p.createdAt;
      const y = d ? new Date(d).getFullYear().toString() : "Unknown";
      yearMap[y] = (yearMap[y] || 0) + 1;
    });

    const publicationsByYear = Object.entries(yearMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // B. Publications by Department
    const deptPubCountMap: Record<string, number> = {};
    departments.forEach((d) => {
      deptPubCountMap[d.code] = 0;
    });
    publications.forEach((p) => {
      const code = p.department?.code || "Other";
      deptPubCountMap[code] = (deptPubCountMap[code] || 0) + 1;
    });

    const publicationsByDepartment = Object.entries(deptPubCountMap).map(([code, count]) => ({
      code,
      count,
    }));

    // C. Publication Status Breakdown
    const statusMap: Record<string, number> = {
      PUBLISHED: 0,
      APPROVED: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      REVISION_REQUIRED: 0,
      REJECTED: 0,
      DRAFT: 0,
    };
    publications.forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });

    const publicationStatus = Object.entries(statusMap).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      rawStatus: name,
      value,
    }));

    // D. Scopus Quartile Breakdown
    const quartileMap: Record<string, number> = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
      UNSPECIFIED: 0,
      NOT_SCOPUS: 0,
    };
    publications.forEach((p) => {
      const q = p.quartile || "UNSPECIFIED";
      quartileMap[q] = (quartileMap[q] || 0) + 1;
    });

    const scopusQuartileBreakdown = Object.entries(quartileMap).map(([quartile, count]) => ({
      quartile: quartile === "NOT_SCOPUS" ? "Not Scopus" : quartile,
      count,
    }));

    // E. Web of Science Indexing
    const wosIndexed = publications.filter((p) => p.isWebOfScience).length;
    const wosNonIndexed = publications.filter((p) => !p.isWebOfScience).length;
    const webOfScienceBreakdown = [
      { category: "WoS Indexed", value: wosIndexed },
      { category: "Non WoS", value: wosNonIndexed },
    ];

    // F. Publication Type Breakdown
    const typeMap: Record<string, number> = {};
    publications.forEach((p) => {
      const t = p.publicationType || "OTHER";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const publicationTypeBreakdown = Object.entries(typeMap).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      rawType: type,
      count,
    }));

    // G. Top Research Areas
    const raCountMap: Record<string, number> = {};
    publications.forEach((p) => {
      const area = p.researchArea?.name || "General Engineering / Unspecified";
      raCountMap[area] = (raCountMap[area] || 0) + 1;
    });
    const researchAreas = Object.entries(raCountMap)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ---------------------------------------------------------
    // 3. DEPARTMENT SCORECARD & TARGET PERFORMANCE
    // ---------------------------------------------------------
    const filteredDepts = departmentId !== "ALL"
      ? departments.filter((d) => d.id === departmentId)
      : campusId !== "ALL"
      ? departments.filter((d) => d.campusId === campusId)
      : departments;

    const departmentScorecard = filteredDepts.map((dept) => {
      const deptPubs = publications.filter((p) => p.departmentId === dept.id);
      
      // Published publications count for official NIRF target achievement
      const published = deptPubs.filter((p) => p.status === PublicationStatus.PUBLISHED).length;
      const approved = deptPubs.filter((p) => p.status === PublicationStatus.APPROVED).length;
      
      // Standard target = Faculty Count * Target Per Faculty
      const target = Math.round(dept.facultyCount * (targetPerFaculty || dept.targetPerFaculty || 3.0));

      const q1 = deptPubs.filter((p) => p.quartile === ScopusQuartile.Q1).length;
      const q2 = deptPubs.filter((p) => p.quartile === ScopusQuartile.Q2).length;
      const wos = deptPubs.filter((p) => p.isWebOfScience).length;

      // Safe achievement % calculation
      const achievementPct = target > 0 ? Number(((published / target) * 100).toFixed(1)) : 0;

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        campusName: dept.campus?.name || "Main Campus",
        facultyCount: dept.facultyCount,
        target,
        published,
        approved,
        totalUnderFilter: deptPubs.length,
        q1,
        q2,
        wos,
        achievementPct,
      };
    });

    // Chart dataset comparing Target vs Actual (Published)
    const departmentTargetPerformance = departmentScorecard.map((item) => ({
      code: item.code,
      target: item.target,
      actual: item.published,
      achievementPct: item.achievementPct,
    }));

    // ---------------------------------------------------------
    // 4. FACULTY PERFORMANCE BREAKDOWN
    // ---------------------------------------------------------
    // Group publication metrics per faculty user
    const facultyMap: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        departmentCode: string;
        publicationCount: number;
        q1Count: number;
        q2Count: number;
        wosCount: number;
        totalCitations: number;
      }
    > = {};

    facultyUsers.forEach((u) => {
      const dCode = departments.find((d) => d.id === u.departmentId)?.code || "N/A";
      facultyMap[u.id] = {
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        departmentCode: dCode,
        publicationCount: 0,
        q1Count: 0,
        q2Count: 0,
        wosCount: 0,
        totalCitations: 0,
      };
    });

    publications.forEach((p) => {
      // Attribute to author or creator
      const authorIds = new Set<string>();
      if (p.createdById) authorIds.add(p.createdById);
      p.authors.forEach((a) => {
        if (a.userId) authorIds.add(a.userId);
      });

      authorIds.forEach((uid) => {
        if (facultyMap[uid]) {
          facultyMap[uid].publicationCount += 1;
          if (p.quartile === ScopusQuartile.Q1) facultyMap[uid].q1Count += 1;
          if (p.quartile === ScopusQuartile.Q2) facultyMap[uid].q2Count += 1;
          if (p.isWebOfScience) facultyMap[uid].wosCount += 1;
          facultyMap[uid].totalCitations += p.citationCount || 0;
        }
      });
    });

    const facultyPerformance = Object.values(facultyMap)
      .filter((f) => (facultyId !== "ALL" ? f.id === facultyId : true))
      .sort((a, b) => b.publicationCount - a.publicationCount);

    // Available options for dynamic dropdowns
    const availableYears = Array.from(
      new Set(
        publications
          .map((p) => {
            const d = p.publicationDate || p.createdAt;
            return d ? new Date(d).getFullYear().toString() : null;
          })
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => b.localeCompare(a));

    if (!availableYears.includes("2026")) availableYears.unshift("2026");
    if (!availableYears.includes("2025")) availableYears.unshift("2025");

    return {
      kpiData,
      charts: {
        publicationsByYear,
        publicationsByDepartment,
        publicationStatus,
        scopusQuartile: scopusQuartileBreakdown,
        webOfScienceBreakdown,
        publicationTypeBreakdown,
        researchAreas,
        departmentTargetPerformance,
      },
      departmentScorecard,
      facultyPerformance,
      options: {
        years: availableYears,
        departments: departments.map((d) => ({ id: d.id, code: d.code, name: d.name })),
        campuses: campuses.map((c) => ({ id: c.id, code: c.code, name: c.name })),
        faculty: facultyUsers.map((f) => ({ id: f.id, name: f.name || f.email, email: f.email })),
      },
    };
  } catch (error) {
    logger.error("Failed to execute getAnalyticsData query", error);
    throw error;
  }
}
