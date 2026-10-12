import db from "@/lib/db";
import { getAnalyticsData } from "@/server/services/analytics.service";
import { PublicationStatus, UserRole } from "@prisma/client";

export async function testAnalyticsSuite() {
  console.log("\n=================================================");
  console.log("📊 4. TESTING ANALYTICS & KPI CALCULATIONS");
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

  // Create isolated test campus & department for deterministic KPI testing
  const campus = await db.campus.findFirst() || await db.campus.create({
    data: { code: `TC_${Date.now()}`, name: `Test Campus ${Date.now()}` },
  });

  const testDept = await db.department.create({
    data: {
      code: `KDEPT_${Math.floor(Math.random() * 10000)}`,
      name: `KPI Test Department ${Date.now()}`,
      campusId: campus.id,
      facultyCount: 5,
    },
  });

  const admin = await db.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (!admin) {
    throw new Error("❌ Admin user required for analytics test execution.");
  }

  const createdPubIds: string[] = [];

  try {
    // 4.1 Seed exact target dataset required by user spec:
    // 10 total: 6 published, 2 accepted (APPROVED), 1 under review, 1 rejected
    const statusesToCreate = [
      PublicationStatus.PUBLISHED,
      PublicationStatus.PUBLISHED,
      PublicationStatus.PUBLISHED,
      PublicationStatus.PUBLISHED,
      PublicationStatus.PUBLISHED,
      PublicationStatus.PUBLISHED,
      PublicationStatus.APPROVED,
      PublicationStatus.APPROVED,
      PublicationStatus.UNDER_REVIEW,
      PublicationStatus.REJECTED,
    ];

    for (let i = 0; i < statusesToCreate.length; i++) {
      const pub = await db.publication.create({
        data: {
          title: `KPI Test Paper #${i + 1}`,
          departmentId: testDept.id,
          status: statusesToCreate[i],
          createdById: admin.id,
        },
      });
      createdPubIds.push(pub.id);
    }

    // 4.2 Query Analytics Service filtered by test department
    const analytics = await getAnalyticsData({ departmentId: testDept.id });
    const { kpiData } = analytics;

    // 4.3 Verify Exact KPI Counter Values
    assert(kpiData.totalPublications === 10, "KPI Analytics: Total publications count matches exactly 10", `Expected 10, got ${kpiData.totalPublications}`);
    assert(kpiData.publishedCount === 6, "KPI Analytics: Published count matches exactly 6", `Expected 6, got ${kpiData.publishedCount}`);
    assert(kpiData.approvedCount === 2, "KPI Analytics: Accepted/Approved count matches exactly 2", `Expected 2, got ${kpiData.approvedCount}`);
    assert(kpiData.underReviewCount === 1, "KPI Analytics: Under Review count matches exactly 1", `Expected 1, got ${kpiData.underReviewCount}`);
    assert(kpiData.rejectedCount === 1, "KPI Analytics: Rejected count matches exactly 1", `Expected 1, got ${kpiData.rejectedCount}`);

    // 4.4 Verify Chart Data Breakdown
    const statusChart = analytics.charts.publicationStatus;
    const publishedChartVal = statusChart.find((s) => s.rawStatus === "PUBLISHED")?.value || 0;
    const approvedChartVal = statusChart.find((s) => s.rawStatus === "APPROVED")?.value || 0;

    assert(publishedChartVal === 6, "Chart Breakdown: Status chart reflects 6 published items");
    assert(approvedChartVal === 2, "Chart Breakdown: Status chart reflects 2 accepted/approved items");

  } finally {
    // Cleanup seeded test dataset
    if (createdPubIds.length > 0) {
      await db.publication.deleteMany({
        where: { id: { in: createdPubIds } },
      });
    }
    await db.department.delete({ where: { id: testDept.id } });
  }

  return { passed, failed };
}
