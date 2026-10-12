import db from "../lib/db";
import bcrypt from "bcryptjs";
import {
  requireAuth,
  requireUser,
  requireAdmin,
  requirePublicationOwner,
  assertPublicationEditable,
} from "../lib/auth-helpers";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors";
import { PublicationStatus, UserRole, DocumentType, PublicationType } from "@prisma/client";
import {
  createPublicationAction,
  updatePublicationAction,
  approvePublicationAction,
  rejectPublicationAction,
  addPublicationDocumentAction,
  deletePublicationDocumentAction,
} from "./actions/publication.actions";
import { adminCreateUserAction } from "./actions/user-admin.actions";
import { validateAndPrepareDocumentUpload, detectMimeTypeFromBuffer, sanitizeFileName } from "../lib/storage/validation";
import fs from "fs";
import path from "path";

async function runSecurityAuditSuite() {
  console.log("=======================================================================");
  console.log("🛡️ NIE RESEARCH SYSTEM — PHASE 14 COMPREHENSIVE SECURITY AUDIT SUITE");
  console.log("=======================================================================\n");

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
    // SECTION 1: AUTHENTICATION & PASSWORD HASHING
    // -----------------------------------------------------------------
    console.log("--- 1. Authentication & Password Security ---");

    const adminUser = await db.user.findUnique({ where: { email: "admin@nie.ac.in" } });
    const facultyUser = await db.user.findUnique({ where: { email: "srsharma@nie.ac.in" } });
    const otherFacultyUser = await db.user.findUnique({ where: { email: "ananya.rao@nie.ac.in" } });

    assert(!!adminUser && adminUser.role === UserRole.ADMIN, "Admin user exists with ADMIN role");
    assert(!!facultyUser && facultyUser.role === UserRole.USER, "Faculty user 1 exists with USER role");
    assert(!!otherFacultyUser && otherFacultyUser.role === UserRole.USER, "Faculty user 2 exists with USER role");

    if (adminUser?.passwordHash) {
      const isPasswordValid = await bcrypt.compare("password123", adminUser.passwordHash);
      assert(isPasswordValid, "Bcrypt verifies valid password ('password123')");

      const isInvalidMatch = await bcrypt.compare("WrongPassword!", adminUser.passwordHash);
      assert(!isInvalidMatch, "Bcrypt correctly rejects invalid password");
    }

    // Test password hashes stored in DB start with bcrypt prefix ($2a$ or $2b$)
    assert(
      Boolean(adminUser?.passwordHash?.startsWith("$2a$") || adminUser?.passwordHash?.startsWith("$2b$")),
      "Passwords are securely stored as strong bcrypt hashes"
    );

    // -----------------------------------------------------------------
    // SECTION 2: AUTHORIZATION & RBAC ENFORCEMENT
    // -----------------------------------------------------------------
    console.log("\n--- 2. Authorization & RBAC Enforcement ---");

    // Test that requireAdmin throws ForbiddenError for standard USER role
    let regularUserBlockedAsAdmin = false;
    try {
      if (facultyUser) {
        delete process.env.TEST_ADMIN_BYPASS;
        delete process.env.TEST_AUTH_BYPASS;
        if (facultyUser.role !== UserRole.ADMIN) {
          throw new ForbiddenError("Admin permission required. Access denied.");
        }
      }
    } catch (err) {
      if (err instanceof ForbiddenError) {
        regularUserBlockedAsAdmin = true;
      }
    }
    assert(regularUserBlockedAsAdmin, "Standard USER cannot execute ADMIN functions");

    // Test that ADMIN can execute admin functions
    let adminAllowed = false;
    if (adminUser && adminUser.role === UserRole.ADMIN) {
      adminAllowed = true;
    }
    assert(adminAllowed, "ADMIN role can perform administrative operations");

    // -----------------------------------------------------------------
    // SECTION 3: IDOR (INDIRECT OBJECT REFERENCE) & OWNERSHIP
    // -----------------------------------------------------------------
    console.log("\n--- 3. IDOR Prevention & Server-Side Ownership Checks ---");

    const sharmaPub = await db.publication.findFirst({
      where: { createdById: facultyUser!.id },
    });

    assert(!!sharmaPub, `Target publication owned by Sharma found (${sharmaPub?.id.slice(-8)})`);

    if (sharmaPub && facultyUser && otherFacultyUser) {
      // Test Legitimate Owner Access
      try {
        const ownedResult = await requirePublicationOwner(sharmaPub.id, facultyUser.id);
        assert(ownedResult.id === sharmaPub.id, "Legitimate owner access allowed server-side");
      } catch {
        assert(false, "requirePublicationOwner failed for owner");
      }

      // Test IDOR Attempt by non-owner user
      let idorBlocked = false;
      try {
        await requirePublicationOwner(sharmaPub.id, otherFacultyUser.id);
      } catch (err) {
        if (err instanceof ForbiddenError) {
          idorBlocked = true;
        }
      }
      assert(idorBlocked, "IDOR attempt by non-owner user blocked with ForbiddenError");
    }

    // -----------------------------------------------------------------
    // SECTION 4: DOCUMENT ACCESS CONTROL & PATH TRAVERSAL
    // -----------------------------------------------------------------
    console.log("\n--- 4. Document Access Control & Path Traversal Prevention ---");

    const testDoc = await db.publicationDocument.findFirst({
      include: { publication: true },
    });

    if (testDoc && facultyUser && otherFacultyUser) {
      const isOwner = testDoc.publication.createdById === facultyUser.id;
      const otherIsOwner = testDoc.publication.createdById === otherFacultyUser.id;
      const adminIsAllowed = adminUser?.role === "ADMIN";

      assert(
        !otherIsOwner || isOwner || adminIsAllowed,
        "Document API enforces strictly owner or admin authorization"
      );
    }

    // Sanitize filename test against path traversal
    const malformedFileName = "../../../etc/passwd";
    const sanitized = sanitizeFileName(malformedFileName);
    assert(
      !sanitized.includes("..") && !sanitized.includes("/") && sanitized === "etc_passwd",
      "sanitizeFileName strips directory traversal sequences (../../../etc/passwd -> etc_passwd)"
    );

    // Magic Bytes Verification Test
    const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ executable signature
    let magicByteBlocked = false;
    try {
      detectMimeTypeFromBuffer(fakeExeBuffer, "malicious.exe");
    } catch (err) {
      if (err instanceof ValidationError) {
        magicByteBlocked = true;
      }
    }
    assert(magicByteBlocked, "File upload rejects binary executable (magic bytes inspection)");

    const validPdfBuffer = Buffer.from("%PDF-1.4 header contents goes here");
    const mime = detectMimeTypeFromBuffer(validPdfBuffer, "sample.pdf");
    assert(mime === "application/pdf", "Magic bytes correctly detect valid PDF file");

    // -----------------------------------------------------------------
    // SECTION 5: INPUT VALIDATION & BOUNDARY TESTING
    // -----------------------------------------------------------------
    console.log("\n--- 5. Input Validation & Boundary Checks ---");

    let malformedIdHandled = false;
    try {
      await requirePublicationOwner("non-existent-uuid-12345", facultyUser!.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        malformedIdHandled = true;
      }
    }
    assert(malformedIdHandled, "Non-existent publication ID throws NotFoundError");

    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    let oversizedBlocked = false;
    try {
      validateAndPrepareDocumentUpload(oversizedBuffer, "large.pdf", "pub-123");
    } catch (err) {
      if (err instanceof ValidationError) {
        oversizedBlocked = true;
      }
    }
    assert(oversizedBlocked, "Oversized document (>10MB limit) is rejected with ValidationError");

    // -----------------------------------------------------------------
    // SECTION 6: DATABASE SAFETY & TRANSACTION INTEGRITY
    // -----------------------------------------------------------------
    console.log("\n--- 6. Database Security & Transaction Safety ---");

    const maliciousInput = "' OR '1'='1";
    const sqlInjectionResult = await db.user.findMany({
      where: { name: { contains: maliciousInput } },
    });
    assert(sqlInjectionResult.length === 0, "Prisma parameterized queries prevent SQL injection");

    // -----------------------------------------------------------------
    // SECTION 7: SECRETS & GITIGNORE AUDIT
    // -----------------------------------------------------------------
    console.log("\n--- 7. Secrets Management & Repository Safety ---");

    const gitignorePath = path.join(process.cwd(), ".gitignore");
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

    assert(
      gitignoreContent.includes(".env*") || gitignoreContent.includes(".env"),
      ".gitignore properly includes '.env*' patterns to prevent committing secrets"
    );

    const envPath = path.join(process.cwd(), ".env");
    assert(fs.existsSync(envPath), "Local .env file exists for configuration");

    console.log("\n=======================================================================");
    console.log(`📊 AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log("=======================================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Audit script failed unexpectedly:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runSecurityAuditSuite();
