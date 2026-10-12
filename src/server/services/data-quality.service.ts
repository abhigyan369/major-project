import db from "@/lib/db";
import { ScopusQuartile, PublicationType } from "@prisma/client";

export type QualityMetricKey =
  | "ALL_ISSUES"
  | "MISSING_DOI"
  | "MISSING_PUB_DATE"
  | "MISSING_ACCEPTANCE_DATE"
  | "MISSING_QUARTILE"
  | "MISSING_DEPARTMENT"
  | "MISSING_INDEXING"
  | "POSSIBLE_DUPLICATES"
  | "INVALID_DATES"
  | "INCOMPLETE_RECORDS";

export interface QualityMetricSummary {
  key: QualityMetricKey;
  label: string;
  count: number;
  description: string;
}

export interface AffectedPublicationItem {
  id: string;
  title: string;
  publicationType: PublicationType;
  doi: string | null;
  status: string;
  createdAt: Date;
  department: {
    id: string;
    code: string;
    name: string;
  };
  faculty: {
    id: string;
    name: string | null;
    email: string;
  };
  issues: string[];
  submissionDate: Date | null;
  acceptanceDate: Date | null;
  publicationDate: Date | null;
  quartile: ScopusQuartile;
  isScopus: boolean;
  isWebOfScience: boolean;
  venueName: string | null;
  journalName: string | null;
}

export interface DataQualityOverview {
  totalRecords: number;
  qualityScore: number;
  metrics: Record<QualityMetricKey, number>;
  metricSummaries: QualityMetricSummary[];
}

/**
 * Normalizes title string for duplicate detection
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Normalizes DOI string for duplicate detection
 */
function normalizeDoi(doi: string | null | undefined): string | null {
  if (!doi) return null;
  const cleaned = doi.trim().toLowerCase();
  if (cleaned === "" || cleaned === "n/a" || cleaned === "na" || cleaned === "null" || cleaned === "undefined") {
    return null;
  }
  return cleaned;
}

/**
 * Evaluates individual quality checks for a publication record
 */
function evaluatePublicationQuality(
  pub: {
    id: string;
    title: string;
    doi: string | null;
    publicationDate: Date | null;
    acceptanceDate: Date | null;
    submissionDate: Date | null;
    quartile: ScopusQuartile;
    isScopus: boolean;
    isWebOfScience: boolean;
    departmentId: string;
    department?: { id: string; code: string; name: string } | null;
    journal?: { isScopus: boolean; isWebOfScience: boolean; name: string } | null;
    venueName?: string | null;
    authors?: Array<unknown>;
  },
  duplicateDoiSet: Set<string>,
  duplicateTitleSet: Set<string>
) {
  const issues: QualityMetricKey[] = [];
  const issueMessages: string[] = [];

  // 1. Missing DOI
  const cleanDoi = normalizeDoi(pub.doi);
  if (!cleanDoi) {
    issues.push("MISSING_DOI");
    issueMessages.push("Missing DOI number");
  }

  // 2. Missing Publication Date
  if (!pub.publicationDate) {
    issues.push("MISSING_PUB_DATE");
    issueMessages.push("Missing publication date");
  }

  // 3. Missing Acceptance Date
  if (!pub.acceptanceDate) {
    issues.push("MISSING_ACCEPTANCE_DATE");
    issueMessages.push("Missing acceptance date");
  }

  // 4. Missing Quartile
  if (!pub.quartile || pub.quartile === ScopusQuartile.UNSPECIFIED) {
    issues.push("MISSING_QUARTILE");
    issueMessages.push("Unspecified Scopus Quartile");
  }

  // 5. Missing Department
  if (!pub.departmentId || !pub.department || pub.department.code === "UNASSIGNED") {
    issues.push("MISSING_DEPARTMENT");
    issueMessages.push("Department unassigned or invalid");
  }

  // 6. Missing Indexing Information
  const journalScopus = pub.journal?.isScopus ?? false;
  const journalWos = pub.journal?.isWebOfScience ?? false;
  const isIndexed = pub.isScopus || pub.isWebOfScience || journalScopus || journalWos;
  if (!isIndexed) {
    issues.push("MISSING_INDEXING");
    issueMessages.push("Neither Scopus nor Web of Science indexing declared");
  }

  // 7. Possible Duplicates
  const normTitle = normalizeTitle(pub.title);
  const isDupDoi = cleanDoi ? duplicateDoiSet.has(cleanDoi) : false;
  const isDupTitle = normTitle.length > 5 ? duplicateTitleSet.has(normTitle) : false;

  if (isDupDoi || isDupTitle) {
    issues.push("POSSIBLE_DUPLICATES");
    if (isDupDoi && isDupTitle) {
      issueMessages.push("Duplicate DOI and matching publication title detected");
    } else if (isDupDoi) {
      issueMessages.push("Matching DOI found on another publication");
    } else {
      issueMessages.push("Matching title found on another publication");
    }
  }

  // 8. Invalid Dates
  let hasInvalidDate = false;
  const nowYear = new Date().getFullYear();

  if (pub.submissionDate && pub.acceptanceDate) {
    if (new Date(pub.submissionDate) > new Date(pub.acceptanceDate)) {
      hasInvalidDate = true;
      issueMessages.push("Submission date occurs after acceptance date");
    }
  }

  if (pub.acceptanceDate && pub.publicationDate) {
    if (new Date(pub.acceptanceDate) > new Date(pub.publicationDate)) {
      hasInvalidDate = true;
      issueMessages.push("Acceptance date occurs after publication date");
    }
  }

  if (pub.submissionDate && pub.publicationDate) {
    if (new Date(pub.submissionDate) > new Date(pub.publicationDate)) {
      hasInvalidDate = true;
      issueMessages.push("Submission date occurs after publication date");
    }
  }

  [pub.submissionDate, pub.acceptanceDate, pub.publicationDate].forEach((d) => {
    if (d) {
      const year = new Date(d).getFullYear();
      if (year < 1950 || year > nowYear + 2) {
        hasInvalidDate = true;
        issueMessages.push(`Implausible date year detected (${year})`);
      }
    }
  });

  if (hasInvalidDate) {
    issues.push("INVALID_DATES");
  }

  // 9. Incomplete Records (missing 2 or more core fields)
  let missingCoreCount = 0;
  if (!cleanDoi) missingCoreCount++;
  if (!pub.publicationDate) missingCoreCount++;
  if (!pub.acceptanceDate) missingCoreCount++;
  if (!pub.quartile || pub.quartile === ScopusQuartile.UNSPECIFIED) missingCoreCount++;
  if (!isIndexed) missingCoreCount++;
  if (!pub.venueName && !pub.journal?.name) missingCoreCount++;

  if (missingCoreCount >= 2) {
    issues.push("INCOMPLETE_RECORDS");
    issueMessages.push(`Incomplete record (${missingCoreCount} core fields missing)`);
  }

  return {
    issues,
    issueMessages,
    // Calculate passed checks out of 7 criteria for quality scoring
    passedChecks: 7 - (
      (!cleanDoi ? 1 : 0) +
      (!pub.publicationDate ? 1 : 0) +
      (!pub.acceptanceDate ? 1 : 0) +
      (!pub.quartile || pub.quartile === ScopusQuartile.UNSPECIFIED ? 1 : 0) +
      (!isIndexed ? 1 : 0) +
      (hasInvalidDate ? 1 : 0) +
      (missingCoreCount >= 2 ? 1 : 0)
    )
  };
}

/**
 * Computes data quality metrics across all publications in the system
 */
export async function getDataQualityOverview(): Promise<DataQualityOverview> {
  const publications = await db.publication.findMany({
    include: {
      department: true,
      journal: true,
      createdBy: true,
      authors: true,
    },
  });

  const totalRecords = publications.length;

  // Build sets for duplicates detection
  const doiCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();

  publications.forEach((pub) => {
    const cleanDoi = normalizeDoi(pub.doi);
    if (cleanDoi) {
      doiCounts.set(cleanDoi, (doiCounts.get(cleanDoi) || 0) + 1);
    }
    const normTitle = normalizeTitle(pub.title);
    if (normTitle.length > 5) {
      titleCounts.set(normTitle, (titleCounts.get(normTitle) || 0) + 1);
    }
  });

  const duplicateDoiSet = new Set<string>();
  doiCounts.forEach((count, doi) => {
    if (count > 1) duplicateDoiSet.add(doi);
  });

  const duplicateTitleSet = new Set<string>();
  titleCounts.forEach((count, title) => {
    if (count > 1) duplicateTitleSet.add(title);
  });

  const counts: Record<QualityMetricKey, number> = {
    ALL_ISSUES: 0,
    MISSING_DOI: 0,
    MISSING_PUB_DATE: 0,
    MISSING_ACCEPTANCE_DATE: 0,
    MISSING_QUARTILE: 0,
    MISSING_DEPARTMENT: 0,
    MISSING_INDEXING: 0,
    POSSIBLE_DUPLICATES: 0,
    INVALID_DATES: 0,
    INCOMPLETE_RECORDS: 0,
  };

  let totalPassedChecks = 0;
  let affectedPublicationsCount = 0;

  publications.forEach((pub) => {
    const evalRes = evaluatePublicationQuality(pub, duplicateDoiSet, duplicateTitleSet);
    totalPassedChecks += evalRes.passedChecks;

    if (evalRes.issues.length > 0) {
      affectedPublicationsCount++;
    }

    evalRes.issues.forEach((issueKey) => {
      counts[issueKey] = (counts[issueKey] || 0) + 1;
    });
  });

  counts.ALL_ISSUES = affectedPublicationsCount;

  // Quality Score: Percentage of passed checks across all records
  const maxPossibleScore = totalRecords * 7;
  const qualityScore = totalRecords > 0 ? Math.max(0, Math.min(100, Math.round((totalPassedChecks / maxPossibleScore) * 100))) : 100;

  const metricSummaries: QualityMetricSummary[] = [
    {
      key: "MISSING_DOI",
      label: "Missing DOI",
      count: counts.MISSING_DOI,
      description: "Publications without a valid Digital Object Identifier (DOI)",
    },
    {
      key: "MISSING_PUB_DATE",
      label: "Missing Publication Date",
      count: counts.MISSING_PUB_DATE,
      description: "Records missing formal publication date timestamp",
    },
    {
      key: "MISSING_ACCEPTANCE_DATE",
      label: "Missing Acceptance Date",
      count: counts.MISSING_ACCEPTANCE_DATE,
      description: "Records missing official manuscript acceptance date",
    },
    {
      key: "MISSING_QUARTILE",
      label: "Missing Quartile",
      count: counts.MISSING_QUARTILE,
      description: "Scopus quartile marked as UNSPECIFIED",
    },
    {
      key: "MISSING_DEPARTMENT",
      label: "Missing Department",
      count: counts.MISSING_DEPARTMENT,
      description: "Unassigned department mapping",
    },
    {
      key: "MISSING_INDEXING",
      label: "Missing Indexing Info",
      count: counts.MISSING_INDEXING,
      description: "Neither Scopus nor Web of Science indexing flagged",
    },
    {
      key: "POSSIBLE_DUPLICATES",
      label: "Possible Duplicates",
      count: counts.POSSIBLE_DUPLICATES,
      description: "Matching DOI or publication title across multiple records",
    },
    {
      key: "INVALID_DATES",
      label: "Invalid Dates",
      count: counts.INVALID_DATES,
      description: "Chronological violations or implausible date values",
    },
    {
      key: "INCOMPLETE_RECORDS",
      label: "Incomplete Records",
      count: counts.INCOMPLETE_RECORDS,
      description: "Records missing 2 or more critical core metadata fields",
    },
  ];

  return {
    totalRecords,
    qualityScore,
    metrics: counts,
    metricSummaries,
  };
}

/**
 * Retrieves affected publication records for a specific quality metric
 */
export async function getAffectedPublications(metricKey: QualityMetricKey): Promise<AffectedPublicationItem[]> {
  const publications = await db.publication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      journal: true,
      createdBy: true,
      authors: true,
    },
  });

  // Build sets for duplicates detection
  const doiCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();

  publications.forEach((pub) => {
    const cleanDoi = normalizeDoi(pub.doi);
    if (cleanDoi) {
      doiCounts.set(cleanDoi, (doiCounts.get(cleanDoi) || 0) + 1);
    }
    const normTitle = normalizeTitle(pub.title);
    if (normTitle.length > 5) {
      titleCounts.set(normTitle, (titleCounts.get(normTitle) || 0) + 1);
    }
  });

  const duplicateDoiSet = new Set<string>();
  doiCounts.forEach((count, doi) => {
    if (count > 1) duplicateDoiSet.add(doi);
  });

  const duplicateTitleSet = new Set<string>();
  titleCounts.forEach((count, title) => {
    if (count > 1) duplicateTitleSet.add(title);
  });

  const affected: AffectedPublicationItem[] = [];

  publications.forEach((pub) => {
    const evalRes = evaluatePublicationQuality(pub, duplicateDoiSet, duplicateTitleSet);

    const matchesMetric =
      metricKey === "ALL_ISSUES"
        ? evalRes.issues.length > 0
        : evalRes.issues.includes(metricKey);

    if (matchesMetric) {
      affected.push({
        id: pub.id,
        title: pub.title,
        publicationType: pub.publicationType,
        doi: pub.doi,
        status: pub.status,
        createdAt: pub.createdAt,
        department: {
          id: pub.department.id,
          code: pub.department.code,
          name: pub.department.name,
        },
        faculty: {
          id: pub.createdBy.id,
          name: pub.createdBy.name,
          email: pub.createdBy.email,
        },
        issues: evalRes.issueMessages,
        submissionDate: pub.submissionDate,
        acceptanceDate: pub.acceptanceDate,
        publicationDate: pub.publicationDate,
        quartile: pub.quartile,
        isScopus: pub.isScopus,
        isWebOfScience: pub.isWebOfScience,
        venueName: pub.venueName,
        journalName: pub.journal?.name || null,
      });
    }
  });

  return affected;
}
