import db from "@/lib/db";
import { UserRole, AuditAction, PublicationStatus, ScopusQuartile, PublicationType } from "@prisma/client";
import {
  getDataQualityOverview,
  getAffectedPublications,
} from "@/server/services/data-quality.service";
import {
  fixDataQualityIssueAction,
} from "@/server/actions/data-quality.actions";

async function runPhase13DataQualityVerificationTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 13: DATA QUALITY DASHBOARD TEST");
  console.log("=================================================\n");

  // 1. Setup Admin Context & Verification Bypass
  const adminUser = await db.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!adminUser) {
    throw new Error("❌ Error: No Admin user found in database for testing.");
  }

  process.env.TEST_ADMIN_BYPASS = "true";
  console.log(`1️⃣  Admin session authenticated as: ${adminUser.email}`);

  // Fetch a valid department for test publications
  const dept = await db.department.findFirst({ where: { isActive: true } });
  if (!dept) {
    throw new Error("❌ Error: No active department found in database.");
  }

  // 2. Fetch Initial Data Quality Overview
  console.log("\n2️⃣  Testing Data Quality Overview & Scoring Service...");
  const initialOverview = await getDataQualityOverview();

  console.log(`   - Total Repository Records: ${initialOverview.totalRecords}`);
  console.log(`   - Data Quality Score: ${initialOverview.qualityScore}%`);
  console.log(`   - Total Issues Detected: ${initialOverview.metrics.ALL_ISSUES}`);

  if (typeof initialOverview.qualityScore !== "number" || initialOverview.qualityScore < 0 || initialOverview.qualityScore > 100) {
    throw new Error("❌ Quality Score calculation invalid (must be between 0% and 100%).");
  }
  console.log(" ✅ PASS: Data Quality Score calculated cleanly.");

  // 3. Create Test Records to Trigger Specific Defect Rules (Duplicates, Invalid Dates, Missing DOI)
  console.log("\n3️⃣  Creating test records with deliberate quality defects...");
  const testDoi = `10.1000/test.dq.${Date.now()}`;
  const testTitle = `Institutional Test Publication for Quality Audit ${Date.now()}`;

  const subDate = new Date("2026-05-10");
  const accDate = new Date("2026-02-01"); // Invalid date: submission after acceptance!

  const testPub1 = await db.publication.create({
    data: {
      title: testTitle,
      publicationType: PublicationType.JOURNAL_ARTICLE,
      departmentId: dept.id,
      createdById: adminUser.id,
      doi: testDoi,
      submissionDate: subDate,
      acceptanceDate: accDate,
      quartile: ScopusQuartile.UNSPECIFIED,
      isScopus: false,
      isWebOfScience: false,
      status: PublicationStatus.SUBMITTED,
    },
  });

  const testPub2 = await db.publication.create({
    data: {
      title: testTitle, // Duplicate Title!
      publicationType: PublicationType.JOURNAL_ARTICLE,
      departmentId: dept.id,
      createdById: adminUser.id,
      doi: `10.1000/dup.title.${Date.now()}`,
      submissionDate: new Date("2025-01-01"),
      acceptanceDate: new Date("2025-03-01"),
      quartile: ScopusQuartile.UNSPECIFIED,
      isScopus: false,
      isWebOfScience: false,
      status: PublicationStatus.SUBMITTED,
    },
  });

  console.log(`   Created Test Pub 1 (ID: ${testPub1.id}) with invalid date sequence`);
  console.log(`   Created Test Pub 2 (ID: ${testPub2.id}) with duplicate publication title`);

  // 4. Verify Auditing Rules Detect Issues
  console.log("\n4️⃣  Verifying audit rules detect duplicate and invalid date records...");
  const updatedOverview = await getDataQualityOverview();

  const dupCount = updatedOverview.metrics.POSSIBLE_DUPLICATES;
  const invalidDateCount = updatedOverview.metrics.INVALID_DATES;
  const missingQuartileCount = updatedOverview.metrics.MISSING_QUARTILE;

  console.log(`   - Possible Duplicates Count: ${dupCount}`);
  console.log(`   - Invalid Dates Count: ${invalidDateCount}`);
  console.log(`   - Missing Quartile Count: ${missingQuartileCount}`);

  if (dupCount < 2) {
    throw new Error("❌ Error: Duplicate detection failed to flag duplicate DOI/title records.");
  }
  if (invalidDateCount < 1) {
    throw new Error("❌ Error: Invalid dates rule failed to detect submission date > acceptance date.");
  }

  console.log(" ✅ PASS: Audit rules successfully detected duplicates and chronological violations.");

  // 5. Test Affected Publications Query
  console.log("\n5️⃣  Testing Affected Publications query for INVALID_DATES metric...");
  const affectedInvDates = await getAffectedPublications("INVALID_DATES");
  const foundTestPub = affectedInvDates.find((p) => p.id === testPub1.id);
  if (!foundTestPub) {
    throw new Error("❌ Error: Test publication 1 not returned in INVALID_DATES affected publications list.");
  }
  console.log(` ✅ PASS: Found affected publication "${foundTestPub.title.substring(0, 40)}..." in metric list.`);

  // 6. Test Administrative Fix & AuditLog Logging
  console.log("\n6️⃣  Testing Admin Data Correction Action & AuditLog recording...");
  const newDoi = `10.1000/fixed.dq.${Date.now()}`;
  const validAccDate = "2026-06-01"; // Corrected acceptance date (after submission)

  const fixRes = await fixDataQualityIssueAction(testPub1.id, {
    metricKey: "INVALID_DATES",
    doi: newDoi,
    acceptanceDate: validAccDate,
    quartile: ScopusQuartile.Q1,
    isScopus: true,
    adminComment: "Corrected invalid acceptance date sequence and assigned Q1 quartile",
  });

  if (!fixRes.success || !fixRes.publication) {
    throw new Error("❌ Error: fixDataQualityIssueAction failed.");
  }

  console.log(" ✅ PASS: Admin correction applied to database.");

  // Verify AuditLog entry
  const auditLog = await db.auditLog.findFirst({
    where: {
      entityId: testPub1.id,
      action: AuditAction.PUBLICATION_UPDATE,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!auditLog) {
    throw new Error("❌ Error: AuditLog entry was not generated for data quality fix.");
  }

  const details = auditLog.details as Record<string, unknown>;
  if (details.actionReason !== "DATA_QUALITY_FIX") {
    throw new Error("❌ Error: AuditLog details missing DATA_QUALITY_FIX actionReason.");
  }

  console.log(" ✅ PASS: AuditLog entry recorded with details:");
  console.log(`       - Action Reason: ${details.actionReason}`);
  console.log(`       - Changed Fields: ${JSON.stringify(details.changedFields)}`);
  console.log(`       - Admin Comment: ${details.adminComment}`);

  // 7. Cleanup Test Records
  console.log("\n7️⃣  Cleaning up test records...");
  await db.auditLog.deleteMany({
    where: { entityId: { in: [testPub1.id, testPub2.id] } },
  });
  await db.publication.deleteMany({
    where: { id: { in: [testPub1.id, testPub2.id] } },
  });
  console.log(" ✅ PASS: Test data cleaned up successfully.");

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 13 DATA QUALITY TESTS PASSED!");
  console.log("=================================================\n");
}

runPhase13DataQualityVerificationTests()
  .catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
