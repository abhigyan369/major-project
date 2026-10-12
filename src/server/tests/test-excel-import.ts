import * as XLSX from "xlsx";
import db from "@/lib/db";
import { parseAndValidateExcel } from "@/server/services/excel-import.service";
import { PublicationStatus, PublicationType, ScopusQuartile } from "@prisma/client";

export async function testExcelImportSuite() {
  console.log("\n=================================================");
  console.log("📈 5. TESTING EXCEL IMPORT & DATA NORMALIZATION");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` ✅ [PASS] ${testName}`);
      if (detail) console.log(`    └─ ${detail}`);
      passed++;
    } else {
      console.error(` ❌ [FAIL] ${testName}`);
      if (detail) console.error(`    └─ ${detail}`);
      failed++;
    }
  }

  // 5.1 Construct In-Memory Excel Sheet with mixed data rows
  const headers = [
    "Publication Title",
    "Author(s)",
    "Department",
    "Campus",
    "Corresponding Author",
    "Designation",
    "Status",
    "Start Date",
    "Submission Date",
    "Acceptance Date",
    "Elapsed Days",
    "Publication Type",
    "Venue / Journal Name",
    "Impact Factor",
    "Quartile",
    "Web of Science",
    "DOI",
    "Citations",
    "Citation Last Updated",
    "Target Venue",
    "Revisions",
    "Keywords",
    "Grant Title",
    "Funding Agency",
    "Grant Amount (Lakhs)",
    "External Collaborators",
    "Student Involvement",
    "PhD Thesis Related",
    "Internal Notes",
  ];

  const row1_valid = [
    `Quantum Computing Advances - ${Date.now()}`,
    "Dr. A. Sharma, Dr. B. Rao",
    "CSE",
    "South Campus",
    "Dr. A. Sharma",
    "Professor",
    "PUBLISHED",
    "2025-01-10",
    "2025-02-15",
    "2025-05-20",
    95,
    "JOURNAL_ARTICLE",
    "IEEE Transactions on Quantum",
    4.85,
    "Q1",
    "YES",
    `10.1109/TQE.2025.${Date.now()}`,
    12,
    "2025-08-01",
    "",
    1,
    "Quantum, Algorithms",
    "DST Quantum Grant",
    "DST",
    15.5,
    "IISc Bangalore",
    "PG ONLY",
    "YES",
    "Clean test record",
  ];

  const row2_normalization = [
    `AI in Smart Grids - ${Date.now()}`,
    "Dr. C. Kumar",
    "ME", // Alias for MECH
    "North Campus",
    "Dr. C. Kumar",
    "Associate Professor",
    "PRESENTED", // Alias for PUBLISHED
    "",
    "2025-03-01",
    "",
    "",
    "CONFERENCE", // Alias for CONFERENCE_PAPER
    "IEEE SmartGridComm",
    "",
    "SCOPUS",
    "FALSE",
    "",
    0,
    "",
    "",
    0,
    "",
    "",
    "",
    "",
    "",
    "NONE",
    "NO",
    "",
  ];

  const row3_invalid_missing_title = [
    "", // Missing Title
    "Dr. D. Varma",
    "ECE",
    "South Campus",
    "",
    "",
    "DRAFT",
    "",
    "",
    "",
    "",
    "JOURNAL",
    "",
    "",
    "",
    "",
    "",
    0,
    "",
    "",
    0,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const row4_invalid_dept = [
    `Blockchain Data Security - ${Date.now()}`,
    "Dr. E. Singh",
    "INVALID_DEPT_CODE", // Bad Dept Code
    "South Campus",
    "",
    "",
    "SUBMITTED",
    "",
    "",
    "",
    "",
    "JOURNAL ARTICLE",
    "",
    "",
    "",
    "",
    "",
    0,
    "",
    "",
    0,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const row5_duplicate_doi = [
    `Duplicate Paper Test - ${Date.now()}`,
    "Dr. F. Naidu",
    "ISE",
    "South Campus",
    "",
    "",
    "PUBLISHED",
    "",
    "",
    "",
    "",
    "JOURNAL ARTICLE",
    "",
    "",
    "Q2",
    "YES",
    row1_valid[16], // Duplicate DOI matching row1
    0,
    "",
    "",
    0,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const sheetData = [
    ["NIE RESEARCH PUBLICATION MANAGEMENT - IMPORT TRACKER"],
    headers,
    row1_valid,
    row2_normalization,
    row3_invalid_missing_title,
    row4_invalid_dept,
    row5_duplicate_doi,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Publication Status Tracker");
  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // 5.2 Parse and Validate Excel Workbook
  const parseResult = await parseAndValidateExcel(excelBuffer, "Test_Import_Suite.xlsx");

  assert(parseResult.totalRows === 5, "Excel Import: Parsed exactly 5 data rows", `Got ${parseResult.totalRows}`);

  // Test Valid Row Parsing
  const parsedRow1 = parseResult.rows.find((r) => r.excelRowIndex === 3);
  assert(parsedRow1?.rowStatus === "VALID", "Valid Row: Clean valid row parsed without error", `Status: ${parsedRow1?.rowStatus}, Warnings: ${parsedRow1?.warnings.join("; ")}`);
  assert(parsedRow1?.normalized?.quartile === ScopusQuartile.Q1, "Valid Row: Quartile correctly parsed as Q1");
  assert(parsedRow1?.normalized?.isWebOfScience === true, "Valid Row: WoS flag correctly detected as true");

  // Test Normalization Logic
  const parsedRow2 = parseResult.rows.find((r) => r.excelRowIndex === 4);
  assert(parsedRow2?.normalized?.departmentCode === "MECH", "Normalization: Dept alias 'ME' normalized to 'MECH'");
  assert(parsedRow2?.normalized?.status === PublicationStatus.PUBLISHED, "Normalization: Status alias 'PRESENTED' normalized to 'PUBLISHED'");
  assert(parsedRow2?.normalized?.publicationType === PublicationType.CONFERENCE_PAPER, "Normalization: Type alias 'CONFERENCE' normalized to 'CONFERENCE_PAPER'");

  // Test Invalid Row (Missing Title)
  const parsedRow3 = parseResult.rows.find((r) => r.excelRowIndex === 5);
  assert(parsedRow3?.rowStatus === "ERROR" && parsedRow3.errors.some((e) => e.includes("Title")), "Invalid Row: Missing title detected with ERROR status");

  // Test Invalid Row (Unknown Department Code)
  const parsedRow4 = parseResult.rows.find((r) => r.excelRowIndex === 6);
  assert(parsedRow4?.rowStatus === "ERROR" && parsedRow4.errors.some((e) => e.includes("department")), "Invalid Row: Invalid department code flagged with ERROR status");

  // Test Duplicate DOI Detection
  const parsedRow5 = parseResult.rows.find((r) => r.excelRowIndex === 7);
  assert(parsedRow5?.rowStatus === "DUPLICATE", "Duplicate Row: In-batch duplicate DOI correctly flagged as DUPLICATE");

  return { passed, failed };
}
