import db from "@/lib/db";
import { testAuthenticationSuite } from "./tests/test-auth";
import { testPublicationsLifecycleSuite } from "./tests/test-publications";
import { testAuthorizationSuite } from "./tests/test-authorization";
import { testAnalyticsSuite } from "./tests/test-analytics";
import { testExcelImportSuite } from "./tests/test-excel-import";
import { testFileUploadsSuite } from "./tests/test-file-uploads";
import { testUISuite } from "./tests/test-ui";

async function runMasterTestRunner() {
  console.log("=========================================================================");
  console.log("🚀 NIE RESEARCH MANAGEMENT SYSTEM — COMPREHENSIVE PHASE 15 TEST SUITE");
  console.log("=========================================================================");

  let totalPassed = 0;
  let totalFailed = 0;

  try {
    // 1. Authentication
    const authRes = await testAuthenticationSuite();
    totalPassed += authRes.passed;
    totalFailed += authRes.failed;

    // 2. Publications Lifecycle
    const pubRes = await testPublicationsLifecycleSuite();
    totalPassed += pubRes.passed;
    totalFailed += pubRes.failed;

    // 3. Authorization & RBAC
    const authzRes = await testAuthorizationSuite();
    totalPassed += authzRes.passed;
    totalFailed += authzRes.failed;

    // 4. Analytics & KPI Calculations
    const analyticsRes = await testAnalyticsSuite();
    totalPassed += analyticsRes.passed;
    totalFailed += analyticsRes.failed;

    // 5. Excel Import Pipeline
    const excelRes = await testExcelImportSuite();
    totalPassed += excelRes.passed;
    totalFailed += excelRes.failed;

    // 6. File Uploads & Document Storage
    const uploadRes = await testFileUploadsSuite();
    totalPassed += uploadRes.passed;
    totalFailed += uploadRes.failed;

    // 7. UI Components & Responsive Layouts
    const uiRes = await testUISuite();
    totalPassed += uiRes.passed;
    totalFailed += uiRes.failed;

    console.log("\n=========================================================================");
    console.log("📊 COMPREHENSIVE TEST SUITE EXECUTION SUMMARY");
    console.log("=========================================================================");
    console.log(` ✅ TOTAL PASSED : ${totalPassed}`);
    console.log(` ❌ TOTAL FAILED : ${totalFailed}`);
    console.log("=========================================================================");

    if (totalFailed > 0) {
      console.error("\n❌ TEST SUITE FAILED WITH ERRORS.");
      process.exit(1);
    } else {
      console.log("\n🎉 ALL COMPREHENSIVE TESTS PASSED SUCCESSFULLY!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n💥 UNHANDLED EXCEPTION DURING TEST SUITE EXECUTION:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runMasterTestRunner();
