import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import {
  PublicationStatus,
  PublicationType,
  ScopusQuartile,
  FacultyDesignation,
  StudentInvolvement,
  AuthorType,
  AuditAction,
  ImportStatus,
} from "@prisma/client";

export interface NormalizedPublicationData {
  title: string;
  authorListRaw: string;
  departmentCode: string;
  campusName: string;
  correspondingAuthorName: string;
  designation?: FacultyDesignation;
  status: PublicationStatus;
  startDate?: Date | null;
  submissionDate?: Date | null;
  acceptanceDate?: Date | null;
  publicationDate?: Date | null;
  elapsedDays?: number | null;
  publicationType: PublicationType;
  venueName?: string | null;
  impactFactor?: number | null;
  quartile: ScopusQuartile;
  isScopus: boolean;
  isWebOfScience: boolean;
  doi?: string | null;
  citationCount: number;
  citationLastUpdated?: Date | null;
  targetVenue?: string | null;
  revisionCount: number;
  researchKeywords: string[];
  grantTitle?: string | null;
  fundingAgency?: string | null;
  grantAmountLakhs?: number | null;
  externalCollaborators?: string | null;
  studentInvolvement: StudentInvolvement;
  isPhdThesisRelated: boolean;
  internalNotes?: string | null;
}

export interface ParsedImportRow {
  excelRowIndex: number;
  rowStatus: "VALID" | "WARNING" | "ERROR" | "DUPLICATE";
  warnings: string[];
  errors: string[];
  raw: Record<string, any>;
  normalized?: NormalizedPublicationData;
}

export interface ParseResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  duplicateCount: number;
  rows: ParsedImportRow[];
}

export interface ImportOptions {
  skipErrors: boolean;
  duplicateHandling: "SKIP" | "UPDATE" | "ALLOW";
}

// Map department variations to canonical codes
const DEPARTMENT_ALIAS_MAP: Record<string, string> = {
  ME: "MECH",
  MECH: "MECH",
  MECHANICAL: "MECH",
  "MECHANICAL ": "MECH",
  "MECH ": "MECH",
  CHEM: "CHEM",
  CHEMISTRY: "CHEM",
  "CHEMISTRY ": "CHEM",
  "CHEM ": "CHEM",
  ECE: "ECE",
  "ECE ": "ECE",
  CSE: "CSE",
  "CSE ": "CSE",
  ISE: "ISE",
  "ISE ": "ISE",
  CIVIL: "CIVIL",
  "CIVIL ": "CIVIL",
  EEE: "EEE",
  "EEE ": "EEE",
  MCA: "MCA",
  "MCA ": "MCA",
  MATHS: "MATHS",
  MATHEMATICS: "MATHS",
  "MATHS ": "MATHS",
  PHY: "PHY",
  PHYSICS: "PHY",
  "PHY ": "PHY",
};

const VALID_DEPT_CODES = new Set([
  "CSE",
  "ISE",
  "ECE",
  "MECH",
  "CIVIL",
  "EEE",
  "MCA",
  "MATHS",
  "PHY",
  "CHEM",
]);

// Map status strings to PublicationStatus enum
const STATUS_ALIAS_MAP: Record<string, PublicationStatus> = {
  PUBLISHED: PublicationStatus.PUBLISHED,
  "PUBLISHED ": PublicationStatus.PUBLISHED,
  PRESENTED: PublicationStatus.PUBLISHED,
  "PRESENTED ": PublicationStatus.PUBLISHED,
  ACCEPTED: PublicationStatus.APPROVED,
  "ACCEPTED ": PublicationStatus.APPROVED,
  APPROVED: PublicationStatus.APPROVED,
  "UNDER REVIEW": PublicationStatus.UNDER_REVIEW,
  "UNDER REVIEW ": PublicationStatus.UNDER_REVIEW,
  UNDER_REVIEW: PublicationStatus.UNDER_REVIEW,
  SUBMITTED: PublicationStatus.SUBMITTED,
  "SUBMITTED ": PublicationStatus.SUBMITTED,
  "DRAFT / WORK IN PROGRESS": PublicationStatus.DRAFT,
  DRAFT: PublicationStatus.DRAFT,
  "REVISION REQUIRED": PublicationStatus.REVISION_REQUIRED,
  REVISION_REQUIRED: PublicationStatus.REVISION_REQUIRED,
  REJECTED: PublicationStatus.REJECTED,
};

// Map publication types to PublicationType enum
const TYPE_ALIAS_MAP: Record<string, PublicationType> = {
  "JOURNAL ARTICLE": PublicationType.JOURNAL_ARTICLE,
  JOURNAL_ARTICLE: PublicationType.JOURNAL_ARTICLE,
  JOURNAL: PublicationType.JOURNAL_ARTICLE,
  "CONFERENCE PAPER": PublicationType.CONFERENCE_PAPER,
  CONFERENCE_PAPER: PublicationType.CONFERENCE_PAPER,
  CONFERENCE: PublicationType.CONFERENCE_PAPER,
  "CONFERENCE ": PublicationType.CONFERENCE_PAPER,
  "BOOK CHAPTER": PublicationType.BOOK_CHAPTER,
  BOOK_CHAPTER: PublicationType.BOOK_CHAPTER,
  "REVIEW ARTICLE": PublicationType.REVIEW_ARTICLE,
  REVIEW_ARTICLE: PublicationType.REVIEW_ARTICLE,
  PATENT: PublicationType.PATENT,
  "OTHER PUBLICATION": PublicationType.OTHER,
  OTHER: PublicationType.OTHER,
};

// Map quartiles to ScopusQuartile enum
const QUARTILE_ALIAS_MAP: Record<string, ScopusQuartile> = {
  Q1: ScopusQuartile.Q1,
  Q2: ScopusQuartile.Q2,
  Q3: ScopusQuartile.Q3,
  Q4: ScopusQuartile.Q4,
  UNSPECIFIED: ScopusQuartile.UNSPECIFIED,
  "NOT SCOPUS": ScopusQuartile.NOT_SCOPUS,
  NOT_SCOPUS: ScopusQuartile.NOT_SCOPUS,
  SCOPUS: ScopusQuartile.UNSPECIFIED,
  "SCOPUS INDEXED": ScopusQuartile.UNSPECIFIED,
};

// Map designations to FacultyDesignation enum
const DESIGNATION_ALIAS_MAP: Record<string, FacultyDesignation> = {
  PROFESSOR: FacultyDesignation.PROFESSOR,
  "ASSOCIATE PROFESSOR": FacultyDesignation.ASSOCIATE_PROFESSOR,
  "ASSISTANT PROFESSOR": FacultyDesignation.ASSISTANT_PROFESSOR,
  "ASSISTANT PROFFESOR": FacultyDesignation.ASSISTANT_PROFESSOR,
  "CONTRACT FACULTY": FacultyDesignation.CONTRACT_FACULTY,
  "RESEARCH SCHOLAR": FacultyDesignation.RESEARCH_SCHOLAR,
  OTHER: FacultyDesignation.OTHER,
};

// Map student involvement
const STUDENT_INVOLVEMENT_MAP: Record<string, StudentInvolvement> = {
  "UG ONLY": StudentInvolvement.UG_ONLY,
  "PG ONLY": StudentInvolvement.PG_ONLY,
  "PHD ONLY": StudentInvolvement.PHD_ONLY,
  MIXED: StudentInvolvement.MIXED,
  NONE: StudentInvolvement.NONE,
};

function parseDateValue(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }
  if (typeof val === "number") {
    // Excel serial date conversion
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }
  if (typeof val === "string") {
    const str = val.trim();
    if (str === "" || str.toUpperCase() === "NONE" || str.toUpperCase() === "N/A") {
      return null;
    }
    // Try DD/MM/YYYY or YYYY-MM-DD
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const p3 = parseInt(parts[2], 10);

      // Handle 4-digit year in first or last position
      let year = p3 > 1000 ? p3 : p1 > 1000 ? p1 : 2000 + (p3 % 100);
      const month = p3 > 1000 ? p2 : p1 > 1000 ? p2 : p2;
      const day = p3 > 1000 ? p1 : p1 > 1000 ? p3 : p1;

      // Fix obvious typos like year 204 or 2040
      if (year < 1990 || year > 2040) year = 2025;

      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }
    const standardParse = new Date(str);
    if (!isNaN(standardParse.getTime())) return standardParse;
  }
  return null;
}

function cleanString(val: any): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  return s.toUpperCase() === "NONE" || s.toUpperCase() === "N/A" ? "" : s;
}

function cleanDoi(val: any): string {
  let doi = cleanString(val);
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  return doi;
}

/**
 * Parses and validates an Excel workbook buffer or file path
 */
export async function parseAndValidateExcel(
  fileInput: Buffer | string,
  fileName: string = "NIE_Publication_Tracker_Enhanced.xlsx"
): Promise<ParseResult> {
  let workbook: XLSX.WorkBook;

  if (typeof fileInput === "string") {
    workbook = XLSX.readFile(fileInput, { cellDates: true });
  } else {
    workbook = XLSX.read(fileInput, { type: "buffer", cellDates: true });
  }

  // Find target sheet
  const targetSheetName =
    workbook.SheetNames.find((name) =>
      name.toLowerCase().includes("publication status tracker")
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`Sheet "${targetSheetName}" not found in workbook.`);
  }

  const rawJson: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  // Find header row (usually row 2 - 0-indexed index 1)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawJson.length); i++) {
    const rowStr = rawJson[i].map((c) => String(c).toLowerCase()).join(" ");
    if (rowStr.includes("title") && rowStr.includes("department")) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = 1; // Fallback to Row 2
  }

  const dataRows = rawJson.slice(headerRowIdx + 1);

  // Fetch existing titles and DOIs from DB to check duplicate collisions
  const existingPubs = await db.publication.findMany({
    select: { title: true, doi: true },
  });

  const dbTitles = new Set(
    existingPubs.map((p: { title: string; doi: string | null }) =>
      p.title.toLowerCase().replace(/\s+/g, " ").trim()
    )
  );
  const dbDois = new Set(
    existingPubs
      .filter((p: { title: string; doi: string | null }) => p.doi)
      .map((p: { title: string; doi: string | null }) => p.doi!.toLowerCase().trim())
  );

  const batchTitles = new Map<string, number>();
  const batchDois = new Map<string, number>();

  const rows: ParsedImportRow[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  // Dynamically map column positions from header row
  const headerRowCells =
    headerRowIdx !== -1 && rawJson[headerRowIdx]
      ? rawJson[headerRowIdx].map((c) => String(c).trim().toLowerCase())
      : [];

  const findColIdx = (keywords: string[], fallbackIdx: number): number => {
    if (headerRowCells.length === 0) return fallbackIdx;
    const foundIdx = headerRowCells.findIndex((h) =>
      keywords.some((kw) => h.includes(kw.toLowerCase()))
    );
    return foundIdx !== -1 ? foundIdx : fallbackIdx;
  };

  const colIdxMap = {
    title: findColIdx(["title of the paper", "publication title", "title"], 0),
    authors: findColIdx(["author(s) list", "author(s)", "authors"], 1),
    dept: findColIdx(["department", "dept"], 2),
    campus: findColIdx(["campus"], 3),
    corrAuthor: findColIdx(["corresponding author name", "corresponding author"], 4),
    designation: findColIdx(["account holder designation", "designation"], 5),
    status: findColIdx(["internal status", "external status", "status"], 6),
    startDate: findColIdx(["start date"], 7),
    subDate: findColIdx(["submission date"], 8),
    accDate: findColIdx(["acceptance date"], 9),
    elapsedDays: findColIdx(["elapsed days"], 10),
    type: findColIdx(["publication type", "type"], 11),
    venue: findColIdx(["journal / conference name", "venue / journal name", "venue", "journal"], 12),
    impactFactor: findColIdx(["impact factor (if)", "impact factor"], 13),
    quartile: findColIdx(["scopus quartile", "quartile"], 14),
    wos: findColIdx(["web of science (wos) indexed", "web of science", "wos"], 15),
    doi: findColIdx(["doi"], 16),
    citation: findColIdx(["citation count", "citations"], 17),
    citationDate: findColIdx(["citation updated on", "citation last updated"], 18),
    targetVenue: findColIdx(["target journal / conference", "target venue"], 19),
    revisions: findColIdx(["rejection / revision count", "revisions"], 20),
    keywords: findColIdx(["keywords"], 21),
    grantTitle: findColIdx(["funding / grant title", "grant title"], 22),
    agency: findColIdx(["funding agency"], 23),
    grantAmount: findColIdx(["grant amount (rs. lakhs)", "grant amount (lakhs)", "grant amount"], 24),
    extCollab: findColIdx(["external collaborators"], 25),
    studentInvol: findColIdx(["student co-authors", "student involvement"], 26),
    phdLink: findColIdx(["phd thesis link", "phd thesis related", "phd"], 27),
    notes: findColIdx(["review notes / comments", "internal notes", "notes"], 28),
  };

  for (let idx = 0; idx < dataRows.length; idx++) {
    const excelRowIndex = headerRowIdx + 2 + idx; // 1-based Excel row
    const rowData = dataRows[idx];

    // Skip empty trailing rows
    if (!rowData || !rowData.some((cell) => cell !== null && String(cell).trim() !== "")) {
      continue;
    }

    const warnings: string[] = [];
    const errors: string[] = [];
    let isDuplicate = false;

    // Extract raw fields using dynamic column index map
    const rawTitle = cleanString(rowData[colIdxMap.title]);
    const rawAuthors = cleanString(rowData[colIdxMap.authors]);
    const rawDept = cleanString(rowData[colIdxMap.dept]);
    const rawCampus = cleanString(rowData[colIdxMap.campus]);
    const rawCorrAuthor = cleanString(rowData[colIdxMap.corrAuthor]);
    const rawDesignation = cleanString(rowData[colIdxMap.designation]);
    const rawStatus = cleanString(rowData[colIdxMap.status]);
    const rawStartDate = rowData[colIdxMap.startDate];
    const rawSubDate = rowData[colIdxMap.subDate];
    const rawAccDate = rowData[colIdxMap.accDate];
    const rawElapsedDays = rowData[colIdxMap.elapsedDays];
    const rawType = cleanString(rowData[colIdxMap.type]);
    const rawVenue = cleanString(rowData[colIdxMap.venue]);
    const rawIF = rowData[colIdxMap.impactFactor];
    const rawQuartile = cleanString(rowData[colIdxMap.quartile]);
    const rawWoS = cleanString(rowData[colIdxMap.wos]);
    const rawDoi = cleanDoi(rowData[colIdxMap.doi]);
    const rawCitation = rowData[colIdxMap.citation];
    const rawCitationDate = rowData[colIdxMap.citationDate];
    const rawTargetVenue = cleanString(rowData[colIdxMap.targetVenue]);
    const rawRevisions = rowData[colIdxMap.revisions];
    const rawKeywords = cleanString(rowData[colIdxMap.keywords]);
    const rawGrantTitle = cleanString(rowData[colIdxMap.grantTitle]);
    const rawAgency = cleanString(rowData[colIdxMap.agency]);
    const rawGrantAmount = rowData[colIdxMap.grantAmount];
    const rawExtCollab = cleanString(rowData[colIdxMap.extCollab]);
    const rawStudentInvol = cleanString(rowData[colIdxMap.studentInvol]);
    const rawPhdLink = cleanString(rowData[colIdxMap.phdLink]);
    const rawNotes = cleanString(rowData[colIdxMap.notes]);

    // Validation 1: Required Title
    if (!rawTitle) {
      errors.push("Publication Title is required");
    }

    // Validation 2: Department Normalization
    const deptKey = rawDept.toUpperCase();
    const normalizedDeptCode = DEPARTMENT_ALIAS_MAP[deptKey] || deptKey;
    if (!normalizedDeptCode) {
      errors.push(`Missing department`);
    } else if (!VALID_DEPT_CODES.has(normalizedDeptCode)) {
      errors.push(`Unknown department code "${rawDept}"`);
    } else if (rawDept !== normalizedDeptCode) {
      warnings.push(`Department "${rawDept}" normalized to "${normalizedDeptCode}"`);
    }

    // Validation 3: Status Normalization
    const statusKey = rawStatus.toUpperCase();
    const normalizedStatus = STATUS_ALIAS_MAP[statusKey];
    if (!normalizedStatus) {
      if (rawStatus) {
        warnings.push(`Unrecognized status "${rawStatus}", normalized to "DRAFT"`);
      } else {
        warnings.push(`Missing publication status, normalized to "DRAFT"`);
      }
    } else if (rawStatus.toUpperCase() !== normalizedStatus) {
      warnings.push(`Status "${rawStatus}" normalized to "${normalizedStatus}"`);
    }

    // Validation 4: Publication Type Normalization
    const typeKey = rawType.toUpperCase();
    let normalizedType = TYPE_ALIAS_MAP[typeKey];
    if (!normalizedType) {
      normalizedType = PublicationType.JOURNAL_ARTICLE;
      if (rawType) {
        warnings.push(`Type "${rawType}" normalized to "JOURNAL_ARTICLE"`);
      } else {
        warnings.push(`Missing publication type, defaulted to "JOURNAL_ARTICLE"`);
      }
    } else if (rawType.toUpperCase() !== normalizedType) {
      warnings.push(`Type "${rawType}" normalized to "${normalizedType}"`);
    }

    // Validation 5: Quartile & Indexing Normalization
    const qKey = rawQuartile.toUpperCase();
    const normalizedQuartile = QUARTILE_ALIAS_MAP[qKey] || ScopusQuartile.UNSPECIFIED;
    if (rawQuartile && !QUARTILE_ALIAS_MAP[qKey]) {
      warnings.push(`Quartile "${rawQuartile}" normalized to "UNSPECIFIED"`);
    }

    const isScopus =
      ([
        ScopusQuartile.Q1,
        ScopusQuartile.Q2,
        ScopusQuartile.Q3,
        ScopusQuartile.Q4,
      ] as ScopusQuartile[]).includes(normalizedQuartile) || rawQuartile.toLowerCase().includes("scopus");

    const isWebOfScience =
      ["YES", "TRUE", "1"].includes(rawWoS.toUpperCase());

    // Validation 6: Designation
    const desigKey = rawDesignation.toUpperCase();
    const normalizedDesignation = DESIGNATION_ALIAS_MAP[desigKey];

    // Validation 7: Student Involvement
    const studentInvolKey = rawStudentInvol.toUpperCase();
    const normalizedStudentInvol = STUDENT_INVOLVEMENT_MAP[studentInvolKey] || StudentInvolvement.NONE;

    // Validation 8: Dates
    const startDate = parseDateValue(rawStartDate);
    const submissionDate = parseDateValue(rawSubDate);
    const acceptanceDate = parseDateValue(rawAccDate);
    const citationLastUpdated = parseDateValue(rawCitationDate);

    // DOI Format & Duplicates Check
    if (rawDoi) {
      const doiLower = rawDoi.toLowerCase();
      if (batchDois.has(doiLower)) {
        isDuplicate = true;
        warnings.push(`Duplicate DOI "${rawDoi}" (First seen at Excel Row ${batchDois.get(doiLower)})`);
      } else if (dbDois.has(doiLower)) {
        isDuplicate = true;
        warnings.push(`Duplicate DOI "${rawDoi}" already exists in PostgreSQL database`);
      } else {
        batchDois.set(doiLower, excelRowIndex);
      }
    } else {
      warnings.push("DOI is missing (optional)");
    }

    // Title Duplicates Check
    if (rawTitle) {
      const titleClean = rawTitle.toLowerCase().replace(/\s+/g, " ").trim();
      if (batchTitles.has(titleClean)) {
        isDuplicate = true;
        warnings.push(`Duplicate title matches Excel Row ${batchTitles.get(titleClean)}`);
      } else if (dbTitles.has(titleClean)) {
        isDuplicate = true;
        warnings.push(`Duplicate title already exists in PostgreSQL database`);
      } else {
        batchTitles.set(titleClean, excelRowIndex);
      }
    }

    // Impact Factor & Numerical parsing
    const impactFactor = rawIF ? parseFloat(String(rawIF)) : null;
    const citationCount = rawCitation ? parseInt(String(rawCitation), 10) || 0 : 0;
    const revisionCount = rawRevisions ? parseInt(String(rawRevisions), 10) || 0 : 0;
    const grantAmountLakhs = rawGrantAmount ? parseFloat(String(rawGrantAmount).replace(/[^0-9\.]/g, "")) : null;

    // Row status classification
    let rowStatus: ParsedImportRow["rowStatus"] = "VALID";
    if (errors.length > 0) {
      rowStatus = "ERROR";
      errorCount++;
    } else if (isDuplicate) {
      rowStatus = "DUPLICATE";
      duplicateCount++;
    } else if (warnings.length > 0) {
      rowStatus = "WARNING";
      warningCount++;
    } else {
      validCount++;
    }

    const normalizedData: NormalizedPublicationData = {
      title: rawTitle,
      authorListRaw: rawAuthors,
      departmentCode: normalizedDeptCode || "CSE",
      campusName: rawCampus || "South Campus",
      correspondingAuthorName: rawCorrAuthor,
      designation: normalizedDesignation,
      status: normalizedStatus || PublicationStatus.DRAFT,
      startDate,
      submissionDate,
      acceptanceDate,
      publicationDate: normalizedStatus === PublicationStatus.PUBLISHED ? (acceptanceDate || new Date()) : null,
      elapsedDays: rawElapsedDays ? parseInt(String(rawElapsedDays), 10) || null : null,
      publicationType: normalizedType,
      venueName: rawVenue,
      impactFactor: impactFactor && !isNaN(impactFactor) ? impactFactor : null,
      quartile: normalizedQuartile,
      isScopus,
      isWebOfScience,
      doi: rawDoi || null,
      citationCount,
      citationLastUpdated,
      targetVenue: rawTargetVenue,
      revisionCount,
      researchKeywords: rawKeywords ? rawKeywords.split(",").map((k) => k.trim()) : [],
      grantTitle: rawGrantTitle,
      fundingAgency: rawAgency,
      grantAmountLakhs: grantAmountLakhs && !isNaN(grantAmountLakhs) ? grantAmountLakhs : null,
      externalCollaborators: rawExtCollab,
      studentInvolvement: normalizedStudentInvol,
      isPhdThesisRelated: ["YES", "TRUE", "1"].includes(rawPhdLink.toUpperCase()),
      internalNotes: rawNotes,
    };

    rows.push({
      excelRowIndex,
      rowStatus,
      warnings,
      errors,
      raw: {
        title: rawTitle,
        authors: rawAuthors,
        department: rawDept,
        campus: rawCampus,
        correspondingAuthor: rawCorrAuthor,
        status: rawStatus,
        type: rawType,
        doi: rawDoi,
        quartile: rawQuartile,
        wos: rawWoS,
      },
      normalized: normalizedData,
    });
  }

  return {
    fileName,
    totalRows: rows.length,
    validCount,
    warningCount,
    errorCount,
    duplicateCount,
    rows,
  };
}

/**
 * Executes database import inside a Prisma transaction
 */
export async function executeBatchImport(
  parseResult: ParseResult,
  options: ImportOptions,
  adminUserId: string
) {
  // Pre-fetch departments map by code
  const departments = await db.department.findMany({
    select: { id: true, code: true },
  });

  const deptMap = new Map<string, string>();
  departments.forEach((d: { id: string; code: string }) => deptMap.set(d.code, d.id));

  // Default department fallback if missing
  const defaultDeptId = departments[0]?.id;

  let importedCount = 0;
  let rejectedCount = 0;
  let updatedCount = 0;

  const result = await db.$transaction(
    async (tx) => {
      // 1. Create ImportBatch record
      const batch = await tx.importBatch.create({
        data: {
          fileName: parseResult.fileName,
          status: ImportStatus.COMPLETED,
          totalRows: parseResult.totalRows,
          importedById: adminUserId,
          warningsCount: parseResult.warningCount,
          errorsCount: parseResult.errorCount,
          summary: {
            valid: parseResult.validCount,
            warnings: parseResult.warningCount,
            errors: parseResult.errorCount,
            duplicates: parseResult.duplicateCount,
          },
        },
      });

      // Process each row
      for (const row of parseResult.rows) {
        if (!row.normalized) continue;

        // Skip errors if configured
        if (row.rowStatus === "ERROR") {
          rejectedCount++;
          continue;
        }

        const data = row.normalized;
        const deptId = deptMap.get(data.departmentCode) || defaultDeptId;
        if (!deptId) {
          rejectedCount++;
          continue;
        }

        // Duplicate resolution in DB
        let existingPub = null;
        if (data.doi) {
          existingPub = await tx.publication.findUnique({
            where: { doi: data.doi },
          });
        }
        if (!existingPub && data.title) {
          existingPub = await tx.publication.findFirst({
            where: {
              title: {
                equals: data.title,
                mode: "insensitive",
              },
            },
          });
        }

        if (existingPub) {
          if (options.duplicateHandling === "SKIP") {
            rejectedCount++;
            continue;
          } else if (options.duplicateHandling === "UPDATE") {
            await tx.publication.update({
              where: { id: existingPub.id },
              data: {
                title: data.title,
                publicationType: data.publicationType,
                venueName: data.venueName,
                status: data.status,
                isScopus: data.isScopus,
                isWebOfScience: data.isWebOfScience,
                quartile: data.quartile,
                impactFactor: data.impactFactor,
                citationCount: data.citationCount,
                startDate: data.startDate,
                submissionDate: data.submissionDate,
                acceptanceDate: data.acceptanceDate,
                publicationDate: data.publicationDate,
                grantTitle: data.grantTitle,
                fundingAgency: data.fundingAgency,
                grantAmountLakhs: data.grantAmountLakhs,
                studentInvolvement: data.studentInvolvement,
                isPhdThesisRelated: data.isPhdThesisRelated,
                internalNotes: data.internalNotes,
              },
            });
            updatedCount++;
            continue;
          }
        }

        // Create new publication
        const newPub = await tx.publication.create({
          data: {
            title: data.title,
            publicationType: data.publicationType,
            venueName: data.venueName,
            doi: data.doi || undefined,
            departmentId: deptId,
            status: data.status,
            isScopus: data.isScopus,
            isWebOfScience: data.isWebOfScience,
            quartile: data.quartile,
            impactFactor: data.impactFactor,
            citationCount: data.citationCount,
            citationLastUpdated: data.citationLastUpdated,
            correspondingAuthorName: data.correspondingAuthorName,
            startDate: data.startDate,
            submissionDate: data.submissionDate,
            acceptanceDate: data.acceptanceDate,
            publicationDate: data.publicationDate,
            grantTitle: data.grantTitle,
            fundingAgency: data.fundingAgency,
            grantAmountLakhs: data.grantAmountLakhs,
            studentInvolvement: data.studentInvolvement,
            isPhdThesisRelated: data.isPhdThesisRelated,
            externalCollaborators: data.externalCollaborators,
            internalNotes: data.internalNotes,
            createdById: adminUserId,
          },
        });

        // Parse and create authors
        if (data.authorListRaw) {
          const authorNames = data.authorListRaw
            .split(/[,;&]/)
            .map((a: string) => a.trim())
            .filter((a: string) => a.length > 0);

          for (let i = 0; i < authorNames.length; i++) {
            const authorName = authorNames[i];
            const isCorr =
              data.correspondingAuthorName &&
              authorName
                .toLowerCase()
                .includes(data.correspondingAuthorName.toLowerCase());

            await tx.publicationAuthor.create({
              data: {
                publicationId: newPub.id,
                authorName,
                authorOrder: i + 1,
                isInternal: true,
                isCorresponding: !!isCorr,
                authorType: AuthorType.FACULTY,
              },
            });
          }
        }

        importedCount++;
      }

      // Update ImportBatch counts
      await tx.importBatch.update({
        where: { id: batch.id },
        data: {
          importedCount,
          rejectedCount,
          updatedCount,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: AuditAction.EXCEL_IMPORT,
          entityType: "ImportBatch",
          entityId: batch.id,
          details: {
            fileName: parseResult.fileName,
            importedCount,
            rejectedCount,
            updatedCount,
            totalRows: parseResult.totalRows,
          },
        },
      });

      return {
        batchId: batch.id,
        importedCount,
        rejectedCount,
        updatedCount,
        totalRows: parseResult.totalRows,
      };
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );

  return result;
}

/**
 * Get past import batches for administration
 */
export async function getImportBatchHistory() {
  return await db.importBatch.findMany({
    include: {
      importedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
