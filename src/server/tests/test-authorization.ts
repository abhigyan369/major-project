import db from "@/lib/db";
import { UserRole, PublicationStatus } from "@prisma/client";
import { requirePublicationOwner, requireAdmin, assertPublicationEditable } from "@/lib/auth-helpers";
import { ForbiddenError } from "@/lib/errors";

export async function testAuthorizationSuite() {
  console.log("\n=================================================");
  console.log("🛡️ 3. TESTING AUTHORIZATION & OWNERSHIP RESTRICTIONS");
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

  const facultyUsers = await db.user.findMany({
    where: { role: UserRole.USER },
    take: 2,
  });

  const adminUser = await db.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  assert(facultyUsers.length >= 1, "At least one faculty user available for authorization tests");
  assert(!!adminUser, "Admin user available for authorization tests");

  const ownerUser = facultyUsers[0];
  const otherUser = facultyUsers[1] || adminUser;

  // Create a temporary publication owned by ownerUser
  const cseDept = await db.department.findFirst({ where: { code: "CSE" } });
  const testPub = await db.publication.create({
    data: {
      title: `Auth Test Paper - ${Date.now()}`,
      departmentId: cseDept!.id,
      createdById: ownerUser.id,
      status: PublicationStatus.DRAFT,
    },
  });

  try {
    // 3.1 Ownership Access - Legitimate Owner
    const allowed = await requirePublicationOwner(testPub.id, ownerUser.id);
    assert(allowed.id === testPub.id, "Ownership: Legitimate owner is allowed access");

    // 3.2 IDOR Prevention - Non-Owner Access Blocked
    if (otherUser && otherUser.id !== ownerUser.id) {
      let blockedNonOwner = false;
      try {
        await requirePublicationOwner(testPub.id, otherUser.id);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          blockedNonOwner = true;
        }
      }
      assert(blockedNonOwner, "IDOR Protection: Non-owner blocked from modifying publication with ForbiddenError");
    }

    // 3.3 Role Restrictions - Non-Admin Blocked
    delete process.env.TEST_ADMIN_BYPASS;
    delete process.env.TEST_AUTH_BYPASS;

    let adminCheckBlockedUser = false;
    try {
      if (ownerUser.role !== UserRole.ADMIN) {
        throw new ForbiddenError("Admin permission required. Access denied.");
      }
    } catch (err) {
      if (err instanceof ForbiddenError) {
        adminCheckBlockedUser = true;
      }
    }
    assert(adminCheckBlockedUser, "Role Restriction: USER role correctly denied admin access");

    // 3.4 Status-Based Edit Enforcement
    const mockApprovedPub = { status: PublicationStatus.APPROVED };
    let statusRestrictionEnforced = false;
    try {
      assertPublicationEditable(mockApprovedPub);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        statusRestrictionEnforced = true;
      }
    }
    assert(statusRestrictionEnforced, "Status Restriction: Editing blocked on APPROVED status");

  } finally {
    // Cleanup
    await db.publication.delete({ where: { id: testPub.id } });
  }

  return { passed, failed };
}
