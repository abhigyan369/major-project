import db from "../lib/db";
import bcrypt from "bcryptjs";
import {
  requirePublicationOwner,
  assertPublicationEditable,
} from "../lib/auth-helpers";
import { ForbiddenError } from "../lib/errors";
import { PublicationStatus, UserRole } from "@prisma/client";

async function runAuthRbacTestSuite() {
  console.log("=================================================");
  console.log("🛡️ NIE RESEARCH SYSTEM — AUTH & RBAC TEST SUITE");
  console.log("=================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failedTests++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: Password Hashing & Credential Verification
    // -----------------------------------------------------------------
    console.log("--- Test Group 1: Credential Verification & Password Hashing ---");
    const adminUser = await db.user.findUnique({ where: { email: "admin@nie.ac.in" } });
    const facultyUser = await db.user.findUnique({ where: { email: "srsharma@nie.ac.in" } });
    const otherFacultyUser = await db.user.findUnique({ where: { email: "ananya.rao@nie.ac.in" } });

    assert(!!adminUser && adminUser.role === UserRole.ADMIN, "Admin account exists with ADMIN role");
    assert(!!facultyUser && facultyUser.role === UserRole.USER, "Faculty account exists with USER role");

    if (adminUser?.passwordHash) {
      const isPasswordValid = await bcrypt.compare("password123", adminUser.passwordHash);
      assert(isPasswordValid, "Bcrypt password hash matches 'password123'");

      const isInvalidMatch = await bcrypt.compare("wrongpassword", adminUser.passwordHash);
      assert(!isInvalidMatch, "Bcrypt correctly rejects invalid password");
    }

    // -----------------------------------------------------------------
    // TEST 2: Ownership Helper & IDOR Prevention
    // -----------------------------------------------------------------
    console.log("\n--- Test Group 2: Ownership Verification & IDOR Prevention ---");

    // Fetch a publication created by Dr. S. R. Sharma (facultyUser)
    const sharmaPub = await db.publication.findFirst({
      where: { createdById: facultyUser!.id },
    });

    assert(!!sharmaPub, "Test publication created by Sharma found");

    if (sharmaPub && facultyUser && otherFacultyUser) {
      // Test owner access (should succeed)
      try {
        const result = await requirePublicationOwner(sharmaPub.id, facultyUser.id);
        assert(result.id === sharmaPub.id, "requirePublicationOwner allows legitimate owner access");
      } catch (err) {
        assert(false, "requirePublicationOwner unexpectedly failed for legitimate owner", String(err));
      }

      // Test IDOR attempt (Dr. Ananya Rao attempting to access/edit Sharma's paper)
      let idorBlocked = false;
      try {
        await requirePublicationOwner(sharmaPub.id, otherFacultyUser.id);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          idorBlocked = true;
        }
      }
      assert(idorBlocked, "IDOR Prevention: Other user attempting to access/modify paper is blocked with ForbiddenError");
    }

    // -----------------------------------------------------------------
    // TEST 3: Publication Status Restriction Enforcement
    // -----------------------------------------------------------------
    console.log("\n--- Test Group 3: Status-Based Edit Restrictions ---");

    const draftPub = await db.publication.findFirst({
      where: { status: PublicationStatus.DRAFT },
    });
    const approvedPub = await db.publication.findFirst({
      where: { status: PublicationStatus.APPROVED },
    });

    if (draftPub) {
      let draftEditable = true;
      try {
        assertPublicationEditable(draftPub);
      } catch {
        draftEditable = false;
      }
      assert(draftEditable, "assertPublicationEditable allows editing DRAFT publications");
    }

    if (approvedPub) {
      let approvedBlocked = false;
      try {
        assertPublicationEditable(approvedPub);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          approvedBlocked = true;
        }
      }
      assert(approvedBlocked, "assertPublicationEditable blocks editing APPROVED publications");
    }

    // -----------------------------------------------------------------
    // TEST 4: Sensitive Data Leakage Audit
    // -----------------------------------------------------------------
    console.log("\n--- Test Group 4: Sensitive Data Protection ---");
    const safeUserSelect = await db.user.findUnique({
      where: { email: "srsharma@nie.ac.in" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        designation: true,
      },
    });

    assert(!("passwordHash" in (safeUserSelect || {})), "User select payload cleanly omits passwordHash");

    console.log("\n=================================================");
    console.log(`📊 SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log("=================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Unexpected error during test suite execution:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runAuthRbacTestSuite();
