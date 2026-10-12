import { PrismaClient, PublicationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function runDatabaseTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING NIE DATABASE INTEGRITY & ANALYTICS TEST");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(` ❌ FAIL: ${testName}`);
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: Entity Counts
    // -----------------------------------------------------------------
    console.log("1️⃣  Verifying Core Infrastructure Counts...");
    const campusCount = await prisma.campus.count();
    const departmentCount = await prisma.department.count();
    const userCount = await prisma.user.count();
    const researchAreaCount = await prisma.researchArea.count();
    const journalCount = await prisma.journal.count();
    const publicationCount = await prisma.publication.count();

    assert(campusCount === 2, `Campuses count expected 2, got ${campusCount}`);
    assert(departmentCount === 10, `Departments count expected 10, got ${departmentCount}`);
    assert(userCount >= 6, `Users count expected >= 6, got ${userCount}`);
    assert(researchAreaCount >= 6, `Research areas count expected >= 6, got ${researchAreaCount}`);
    assert(journalCount >= 6, `Journals count expected >= 6, got ${journalCount}`);
    assert(publicationCount === 7, `Publications count expected 7, got ${publicationCount}`);

    // -----------------------------------------------------------------
    // TEST 2: Relational Integrity & Author Joining
    // -----------------------------------------------------------------
    console.log("\n2️⃣  Testing Relational Joins (Publication -> Authors -> Department -> Journal)...");
    const fullPub = await prisma.publication.findFirst({
      where: { status: PublicationStatus.PUBLISHED },
      include: {
        department: { include: { campus: true } },
        journal: true,
        researchArea: true,
        createdBy: true,
        correspondingAuthor: true,
        authors: { include: { user: true }, orderBy: { authorOrder: "asc" } },
        approvals: { include: { admin: true } },
        documents: true,
        notifications: true,
      },
    });

    assert(fullPub !== null, "Published paper query returned record");
    if (fullPub) {
      assert(fullPub.department.code === "CSE", "Publication belongs to CSE department");
      assert(fullPub.department.campus.code === "SOUTH", "CSE department belongs to South Campus");
      assert(fullPub.journal?.name.includes("IEEE Transactions") === true, "Publication correctly linked to IEEE Journal");
      assert(fullPub.authors.length === 3, `Publication has 3 normalized authors, got ${fullPub.authors.length}`);
      assert(fullPub.authors[0].isCorresponding === true, "First author marked as corresponding");
      assert(fullPub.authors[2].isInternal === false, "Third author correctly marked as external co-author");
      assert(fullPub.approvals.length === 1, "Publication has 1 approval record");
      assert(fullPub.approvals[0].action === "APPROVED", "Approval action is APPROVED");
      assert(fullPub.documents.length === 1, "Publication has 1 document attachment");
    }

    // -----------------------------------------------------------------
    // TEST 3: Analytics Aggregation (Department Performance against Targets)
    // -----------------------------------------------------------------
    console.log("\n3️⃣  Testing Executive Analytics Query (Department Targets & Counts)...");
    const deptAnalytics = await prisma.department.findMany({
      select: {
        code: true,
        name: true,
        facultyCount: true,
        targetPerFaculty: true,
        _count: {
          select: {
            publications: true,
            users: true,
          },
        },
        publications: {
          select: {
            status: true,
            quartile: true,
            isWebOfScience: true,
          },
        },
      },
    });

    assert(deptAnalytics.length === 10, "Fetched 10 department analytics summaries");

    const cseStats = deptAnalytics.find((d) => d.code === "CSE");
    assert(cseStats !== undefined, "CSE stats present in analytics query");
    if (cseStats) {
      const cseTarget = cseStats.facultyCount * cseStats.targetPerFaculty;
      console.log(`   📊 CSE Stats: Faculty = ${cseStats.facultyCount}, Target Papers = ${cseTarget}, Total Pubs = ${cseStats._count.publications}`);
      assert(cseTarget === 213, `CSE Target Papers expected 213, got ${cseTarget}`);
      assert(cseStats._count.publications === 3, `CSE Total Pubs expected 3, got ${cseStats._count.publications}`);
    }

    // -----------------------------------------------------------------
    // TEST 4: Scopus Quartile Breakdown Analytics
    // -----------------------------------------------------------------
    console.log("\n4️⃣  Testing Scopus Quartile & WoS Indexing Aggregation...");
    const quartileGroup = await prisma.publication.groupBy({
      by: ["quartile"],
      _count: { _all: true },
    });

    const wosCount = await prisma.publication.count({
      where: { isWebOfScience: true },
    });

    console.log("   📊 Quartile Breakdown:", quartileGroup);
    console.log(`   📊 Total Web of Science Papers: ${wosCount}`);
    assert(wosCount >= 3, `Web of Science papers expected >= 3, got ${wosCount}`);

    // -----------------------------------------------------------------
    // TEST 5: Pipeline Status Count Aggregation
    // -----------------------------------------------------------------
    console.log("\n5️⃣  Testing Pipeline Status Aggregation...");
    const statusGroup = await prisma.publication.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    console.log("   📊 Pipeline Breakdown:", statusGroup);
    assert(statusGroup.length >= 6, `At least 6 distinct pipeline statuses present in DB, got ${statusGroup.length}`);

    // -----------------------------------------------------------------
    // TEST 6: Audit Log & Notification Inspection
    // -----------------------------------------------------------------
    console.log("\n6️⃣  Verifying Audit Log & Notification Tracking...");
    const auditLogs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    assert(auditLogs.length >= 5, `Audit log records expected >= 5, got ${auditLogs.length}`);

    const notifications = await prisma.notification.findMany({
      where: { isRead: false },
    });

    assert(notifications.length >= 2, `Unread notifications expected >= 2, got ${notifications.length}`);

    // -----------------------------------------------------------------
    // FINAL SUMMARY
    // -----------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED!`);
    console.log("=================================================\n");

    if (passedTests === totalTests) {
      console.log("🎉 SUCCESS: DATABASE SCHEMA & SEED DATA PASSED ALL INTEGRITY & ANALYTICS AUDITS!");
    } else {
      console.error("⚠️ SOME INTEGRITY TESTS FAILED.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ DB TEST ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDatabaseTests();
