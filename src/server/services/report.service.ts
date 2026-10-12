import * as XLSX from "xlsx";
import db from "@/lib/db";
import { Prisma, PublicationStatus, PublicationType, ScopusQuartile } from "@prisma/client";

export interface ReportFilterParams {
  preset?: string | null;
  reportType?: "PUBLICATIONS" | "DEPT_PERFORMANCE" | "FACULTY_PERFORMANCE";
  year?: string;
  quarter?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  campusId?: string;
  facultyId?: string;
  publicationType?: string;
  status?: string;
  scopusQuartile?: string;
  webOfScience?: string;
  search?: string;
}

export interface AdminUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "N/A";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "N/A";
  }
}

/**
 * Humanize Enum strings (e.g. JOURNAL_ARTICLE -> Journal Article)
 */
function humanizeEnum(val: string | null | undefined): string {
  if (!val) return "N/A";
  return val
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalizes filter inputs and resolves presets
 */
export async function getReportData(filters: ReportFilterParams, adminUser: AdminUserContext) {
  const normalizedFilters: ReportFilterParams = { ...filters };

  // Apply Presets if specified
  if (filters.preset === "2026_CSE") {
    normalizedFilters.year = "2026";
    normalizedFilters.reportType = "PUBLICATIONS";
    const cseDept = await db.department.findUnique({ where: { code: "CSE" } });
    if (cseDept) normalizedFilters.departmentId = cseDept.id;
  } else if (filters.preset === "Q1_PUBS") {
    normalizedFilters.scopusQuartile = "Q1";
    normalizedFilters.reportType = "PUBLICATIONS";
  } else if (filters.preset === "PUBLISHED_PUBS") {
    normalizedFilters.status = "PUBLISHED";
    normalizedFilters.reportType = "PUBLICATIONS";
  } else if (filters.preset === "DEPT_PERFORMANCE") {
    normalizedFilters.reportType = "DEPT_PERFORMANCE";
  } else if (filters.preset === "FACULTY_PERFORMANCE") {
    normalizedFilters.reportType = "FACULTY_PERFORMANCE";
  }

  const reportType = normalizedFilters.reportType || "PUBLICATIONS";

  if (reportType === "DEPT_PERFORMANCE") {
    return await getDepartmentPerformanceData(normalizedFilters, adminUser);
  } else if (reportType === "FACULTY_PERFORMANCE") {
    return await getFacultyPerformanceData(normalizedFilters, adminUser);
  } else {
    return await getPublicationsReportData(normalizedFilters, adminUser);
  }
}

/**
 * 1. Filtered Publications Report Data Generator
 */
async function getPublicationsReportData(filters: ReportFilterParams, adminUser: AdminUserContext) {
  const {
    year = "ALL",
    quarter = "ALL",
    startDate,
    endDate,
    departmentId = "ALL",
    campusId = "ALL",
    facultyId = "ALL",
    publicationType = "ALL",
    status = "ALL",
    scopusQuartile = "ALL",
    webOfScience = "ALL",
    search,
  } = filters;

  const where: Prisma.PublicationWhereInput = {};

  if (search && search.trim()) {
    const query = search.trim();
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { doi: { contains: query, mode: "insensitive" } },
      { venueName: { contains: query, mode: "insensitive" } },
      { journal: { name: { contains: query, mode: "insensitive" } } },
      { createdBy: { name: { contains: query, mode: "insensitive" } } },
      { authors: { some: { authorName: { contains: query, mode: "insensitive" } } } },
    ];
  }

  if (departmentId !== "ALL") {
    where.departmentId = departmentId;
  } else if (campusId !== "ALL") {
    where.department = { campusId };
  }

  if (facultyId !== "ALL") {
    const facultyFilter = {
      OR: [
        { createdById: facultyId },
        { correspondingAuthorId: facultyId },
        { authors: { some: { userId: facultyId } } },
      ],
    };
    if (where.OR) {
      where.AND = [{ OR: where.OR }, facultyFilter];
      delete where.OR;
    } else {
      where.OR = facultyFilter.OR;
    }
  }

  if (publicationType !== "ALL" && Object.values(PublicationType).includes(publicationType as PublicationType)) {
    where.publicationType = publicationType as PublicationType;
  }

  if (status !== "ALL" && Object.values(PublicationStatus).includes(status as PublicationStatus)) {
    where.status = status as PublicationStatus;
  }

  if (scopusQuartile !== "ALL" && Object.values(ScopusQuartile).includes(scopusQuartile as ScopusQuartile)) {
    where.quartile = scopusQuartile as ScopusQuartile;
  }

  if (webOfScience === "INDEXED") {
    where.isWebOfScience = true;
  } else if (webOfScience === "NON_INDEXED") {
    where.isWebOfScience = false;
  }

  // Date/Year/Quarter filtering
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
  } else if (quarter !== "ALL" && year !== "ALL") {
    const yr = parseInt(year, 10);
    if (!isNaN(yr)) {
      let qStartMonth = 0;
      let qEndMonth = 2;
      let qEndDay = 31;
      if (quarter === "Q1") { qStartMonth = 0; qEndMonth = 2; qEndDay = 31; }
      else if (quarter === "Q2") { qStartMonth = 3; qEndMonth = 5; qEndDay = 30; }
      else if (quarter === "Q3") { qStartMonth = 6; qEndMonth = 8; qEndDay = 30; }
      else if (quarter === "Q4") { qStartMonth = 9; qEndMonth = 11; qEndDay = 31; }

      const start = new Date(Date.UTC(yr, qStartMonth, 1));
      const end = new Date(Date.UTC(yr, qEndMonth, qEndDay, 23, 59, 59, 999));

      const quarterFilter = [
        { publicationDate: { gte: start, lte: end } },
        { AND: [{ publicationDate: null }, { createdAt: { gte: start, lte: end } }] },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: quarterFilter }];
        delete where.OR;
      } else {
        where.OR = quarterFilter;
      }
    }
  } else if (year !== "ALL") {
    const yr = parseInt(year, 10);
    if (!isNaN(yr)) {
      const startOfYear = new Date(Date.UTC(yr, 0, 1));
      const endOfYear = new Date(Date.UTC(yr, 11, 31, 23, 59, 59, 999));
      const yearFilter = [
        { publicationDate: { gte: startOfYear, lte: endOfYear } },
        { AND: [{ publicationDate: null }, { createdAt: { gte: startOfYear, lte: endOfYear } }] },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: yearFilter }];
        delete where.OR;
      } else {
        where.OR = yearFilter;
      }
    }
  }

  const publications = await db.publication.findMany({
    where,
    include: {
      department: { include: { campus: true } },
      journal: true,
      researchArea: true,
      createdBy: true,
      correspondingAuthor: true,
      authors: {
        orderBy: { authorOrder: "asc" },
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Prepare clean headers matching NIE_Master_Articles_Template.xlsx exactly
  const headers = [
    "Sl No",
    "Account Holder Full Name",
    "Account Holder Email",
    "Account Holder Phone",
    "Account Holder Designation",
    "Department",
    "Campus",
    "Title of the Paper",
    "Abstract",
    "Keywords",
    "Research Area",
    "Publication Type",
    "Journal / Conference Name",
    "Publisher Name",
    "Publication Year",
    "Volume",
    "Issue",
    "Pages",
    "DOI",
    "ISSN",
    "ISBN",
    "Published Link / URL",
    "Author(s) List",
    "Corresponding Author Name",
    "External Collaborators",
    "Student Co-authors",
    "External Status",
    "Internal Status",
    "Scopus Quartile",
    "Web of Science (WoS) Indexed",
    "Impact Factor (IF)",
    "Citation Count",
    "Citation Updated On",
    "Target Journal / Conference",
    "Rejection / Revision Count",
    "Start Date",
    "Submission Date",
    "Acceptance Date",
    "Funding / Grant Title",
    "Funding Agency",
    "Grant Amount (Rs. Lakhs)",
    "PhD Thesis Link",
    "Review Notes / Comments",
  ];

  const dataRows = publications.map((p, idx) => {
    const authorsStr = p.authors
      .map((a) => `${a.authorName}${a.affiliation ? ` (${a.affiliation})` : ""}`)
      .join(", ");

    const studentCoAuthors = p.authors
      .filter((a) => a.isStudent || a.authorType === "STUDENT")
      .map((a) => `${a.authorName}${a.affiliation ? ` (${a.affiliation})` : ""}`)
      .join(", ");

    const pubYear = p.publicationDate
      ? new Date(p.publicationDate).getFullYear()
      : p.createdAt
      ? new Date(p.createdAt).getFullYear()
      : "N/A";

    const externalStatus =
      p.status === PublicationStatus.PUBLISHED
        ? "Published"
        : p.status === PublicationStatus.APPROVED
        ? "Accepted"
        : p.status === PublicationStatus.SUBMITTED
        ? "Submitted"
        : humanizeEnum(p.status);

    return [
      idx + 1,
      p.createdBy?.name || "N/A",
      p.createdBy?.email || "N/A",
      "N/A",
      humanizeEnum(p.createdBy?.designation) || "Faculty",
      p.department?.code || p.department?.name || "N/A",
      p.department?.campus?.name || "South",
      p.title || "N/A",
      "N/A",
      p.researchArea?.description || "N/A",
      p.researchArea?.name || "N/A",
      humanizeEnum(p.publicationType),
      p.journal?.name || p.venueName || "N/A",
      p.publisher || p.journal?.publisher || "N/A",
      pubYear,
      p.volume || "N/A",
      p.issue || "N/A",
      p.pages || "N/A",
      p.doi || "N/A",
      p.issn || p.journal?.issn || "N/A",
      "N/A",
      p.publicationUrl || "N/A",
      authorsStr || "N/A",
      p.correspondingAuthorName || p.correspondingAuthor?.name || "N/A",
      p.externalCollaborators || "N/A",
      studentCoAuthors || "N/A",
      externalStatus,
      humanizeEnum(p.status),
      p.quartile === "UNSPECIFIED" ? "Unspecified" : p.quartile,
      p.isWebOfScience ? "Yes" : "No",
      p.impactFactor ? Number(p.impactFactor) : 0,
      p.citationCount || 0,
      formatDate(p.citationLastUpdated),
      p.journal?.name || p.venueName || "N/A",
      0,
      formatDate(p.startDate),
      formatDate(p.submissionDate),
      formatDate(p.acceptanceDate),
      p.grantTitle || "N/A",
      p.fundingAgency || "N/A",
      p.grantAmountLakhs ? Number(p.grantAmountLakhs) : 0,
      p.isPhdThesisRelated ? "Yes" : "N/A",
      p.internalNotes || "N/A",
    ];
  });

  return {
    reportTitle: "NIE Mysuru - Master Institutional Publications Report",
    reportType: "PUBLICATIONS" as const,
    appliedFilters: summarizeFilters(filters),
    recordCount: publications.length,
    headers,
    dataRows,
    rawRecords: publications,
  };
}

/**
 * 2. Department Performance Report Data Generator
 */
async function getDepartmentPerformanceData(filters: ReportFilterParams, adminUser: AdminUserContext) {
  const { departmentId = "ALL", campusId = "ALL" } = filters;

  const departments = await db.department.findMany({
    where: {
      ...(departmentId !== "ALL" ? { id: departmentId } : {}),
      ...(campusId !== "ALL" ? { campusId } : {}),
    },
    include: { campus: true },
    orderBy: { code: "asc" },
  });

  const publications = await db.publication.findMany({
    include: { department: true },
  });

  const headers = [
    "Sl No",
    "Department Code",
    "Department Name",
    "Campus",
    "Faculty Count",
    "Target Per Faculty",
    "Total Department Target",
    "Published Publications",
    "Approved Publications",
    "Total Submissions",
    "Q1 Publications",
    "Q2 Publications",
    "Web of Science Indexed",
    "NIRF Target Achievement %",
  ];

  const dataRows = departments.map((dept, idx) => {
    const deptPubs = publications.filter((p) => p.departmentId === dept.id);
    const published = deptPubs.filter((p) => p.status === PublicationStatus.PUBLISHED).length;
    const approved = deptPubs.filter((p) => p.status === PublicationStatus.APPROVED).length;
    const q1 = deptPubs.filter((p) => p.quartile === ScopusQuartile.Q1).length;
    const q2 = deptPubs.filter((p) => p.quartile === ScopusQuartile.Q2).length;
    const wos = deptPubs.filter((p) => p.isWebOfScience).length;

    const target = Math.round(dept.facultyCount * (dept.targetPerFaculty || 3.0));
    const achievementPct = target > 0 ? Number(((published / target) * 100).toFixed(1)) : 0;

    return [
      idx + 1,
      dept.code,
      dept.name,
      dept.campus?.name || "Main Campus",
      dept.facultyCount,
      dept.targetPerFaculty,
      target,
      published,
      approved,
      deptPubs.length,
      q1,
      q2,
      wos,
      `${achievementPct}%`,
    ];
  });

  return {
    reportTitle: "NIE Mysuru - Department Performance Scorecard Report",
    reportType: "DEPT_PERFORMANCE" as const,
    appliedFilters: summarizeFilters(filters),
    recordCount: departments.length,
    headers,
    dataRows,
  };
}

/**
 * 3. Faculty Performance Report Data Generator
 */
async function getFacultyPerformanceData(filters: ReportFilterParams, adminUser: AdminUserContext) {
  const { departmentId = "ALL", facultyId = "ALL" } = filters;

  const facultyUsers = await db.user.findMany({
    where: {
      role: "USER",
      ...(departmentId !== "ALL" ? { departmentId } : {}),
      ...(facultyId !== "ALL" ? { id: facultyId } : {}),
    },
    include: { department: true },
    orderBy: { name: "asc" },
  });

  const publications = await db.publication.findMany({
    include: {
      authors: true,
    },
  });

  const headers = [
    "Sl No",
    "Faculty Name",
    "Faculty Email",
    "Department Code",
    "Department Name",
    "Designation",
    "Total Publications",
    "Q1 Publications",
    "Q2 Publications",
    "Web of Science Indexed",
    "Total Citations",
  ];

  const dataRows = facultyUsers.map((fac, idx) => {
    const facPubs = publications.filter(
      (p) =>
        p.createdById === fac.id ||
        p.correspondingAuthorId === fac.id ||
        p.authors.some((a) => a.userId === fac.id)
    );

    const q1 = facPubs.filter((p) => p.quartile === ScopusQuartile.Q1).length;
    const q2 = facPubs.filter((p) => p.quartile === ScopusQuartile.Q2).length;
    const wos = facPubs.filter((p) => p.isWebOfScience).length;
    const totalCitations = facPubs.reduce((sum, p) => sum + (p.citationCount || 0), 0);

    return [
      idx + 1,
      fac.name || "N/A",
      fac.email,
      fac.department?.code || "N/A",
      fac.department?.name || "N/A",
      humanizeEnum(fac.designation),
      facPubs.length,
      q1,
      q2,
      wos,
      totalCitations,
    ];
  });

  return {
    reportTitle: "NIE Mysuru - Faculty Performance Report",
    reportType: "FACULTY_PERFORMANCE" as const,
    appliedFilters: summarizeFilters(filters),
    recordCount: facultyUsers.length,
    headers,
    dataRows,
  };
}

/**
 * Summarize filters for report metadata headers
 */
function summarizeFilters(filters: ReportFilterParams): string {
  const parts: string[] = [];
  if (filters.preset) parts.push(`Preset: ${filters.preset}`);
  if (filters.year && filters.year !== "ALL") parts.push(`Year: ${filters.year}`);
  if (filters.quarter && filters.quarter !== "ALL") parts.push(`Quarter: ${filters.quarter}`);
  if (filters.startDate) parts.push(`From: ${filters.startDate}`);
  if (filters.endDate) parts.push(`To: ${filters.endDate}`);
  if (filters.departmentId && filters.departmentId !== "ALL") parts.push(`Department Filter Active`);
  if (filters.campusId && filters.campusId !== "ALL") parts.push(`Campus Filter Active`);
  if (filters.status && filters.status !== "ALL") parts.push(`Status: ${filters.status}`);
  if (filters.scopusQuartile && filters.scopusQuartile !== "ALL") parts.push(`Quartile: ${filters.scopusQuartile}`);
  if (filters.webOfScience && filters.webOfScience !== "ALL") parts.push(`WoS: ${filters.webOfScience}`);
  if (filters.publicationType && filters.publicationType !== "ALL") parts.push(`Type: ${filters.publicationType}`);
  if (filters.search) parts.push(`Search: "${filters.search}"`);

  return parts.length > 0 ? parts.join(" | ") : "All Institutional Data (No Filters)";
}

/**
 * Generates formatted Excel Buffer (.xlsx) with metadata header
 */
export function generateExcelBuffer(
  _reportTitle: string,
  _appliedFilters: string,
  headers: string[],
  dataRows: (string | number)[][],
  _adminUser: AdminUserContext
): Buffer {
  // Build Excel Array of Arrays (AOA) - Starts directly with header row matching NIE_Master_Articles_Template.xlsx
  const aoa: (string | number)[][] = [
    headers,
    ...dataRows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Set column widths dynamically for clean appearance
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    dataRows.forEach((row) => {
      const val = row[i];
      if (val !== undefined && val !== null) {
        const len = String(val).length;
        if (len > maxLen) maxLen = Math.min(len, 60);
      }
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });

  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Articles Master Data");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Generates formatted CSV Buffer (.csv) with metadata header
 */
export function generateCsvBuffer(
  reportTitle: string,
  appliedFilters: string,
  headers: string[],
  dataRows: (string | number)[][],
  adminUser: AdminUserContext
): Buffer {
  const timestampStr = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
  const generatedByStr = `${adminUser.name || "Administrator"} (${adminUser.email})`;

  const csvLines: string[] = [];

  // Add Metadata comments
  csvLines.push(`# ${reportTitle}`);
  csvLines.push(`# Report Generation Timestamp: ${timestampStr}`);
  csvLines.push(`# Generated By: ${generatedByStr}`);
  csvLines.push(`# Applied Filters: ${appliedFilters}`);
  csvLines.push("#");

  // Helper function to escape CSV values safely
  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Add Headers
  csvLines.push(headers.map(escapeCsv).join(","));

  // Add Data Rows
  dataRows.forEach((row) => {
    csvLines.push(row.map(escapeCsv).join(","));
  });

  const csvString = csvLines.join("\n");
  return Buffer.from(csvString, "utf-8");
}
