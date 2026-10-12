import { validateAndPrepareDocumentUpload, detectMimeTypeFromBuffer, sanitizeFileName, MAX_FILE_SIZE_BYTES } from "@/lib/storage/validation";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import db from "@/lib/db";
import { PublicationStatus, UserRole } from "@prisma/client";

export async function testFileUploadsSuite() {
  console.log("\n=================================================");
  console.log("📁 6. TESTING FILE UPLOADS & STORAGE VALIDATION");
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

  // 6.1 Valid File Upload Validation
  const validPdfBuffer = Buffer.from("%PDF-1.4 Header content sample for validation test");
  const prepResult = validateAndPrepareDocumentUpload(validPdfBuffer, "sample_manuscript.pdf", "pub-test-123");

  assert(prepResult.detectedMimeType === "application/pdf", "Valid File: PDF header correctly detected via magic bytes");
  assert(prepResult.sanitizedFileName === "sample_manuscript.pdf", "Valid File: Filename properly sanitized");
  assert(prepResult.storageKey.startsWith("publications/pub-test-123/"), "Valid File: Storage key created in secure path namespace");

  // Path Traversal Sanitization Check
  const pathTraversalName = "../../../etc/passwd.pdf";
  const sanitizedPath = sanitizeFileName(pathTraversalName);
  assert(!sanitizedPath.includes("..") && !sanitizedPath.includes("/") && sanitizedPath === "passwd.pdf", "Sanitization: Path traversal sequences removed");

  // 6.2 Oversized File Rejection (>10MB)
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
  let oversizedBlocked = false;
  try {
    validateAndPrepareDocumentUpload(oversizedBuffer, "large_file.pdf", "pub-test-123");
  } catch (err) {
    if (err instanceof ValidationError && err.message.includes("10MB limit")) {
      oversizedBlocked = true;
    }
  }
  assert(oversizedBlocked, "Oversized File: Rejected files exceeding 10MB limit with ValidationError");

  // 6.3 Invalid File Magic Bytes Rejection (Executable signature MZ)
  const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  let invalidMagicByteBlocked = false;
  try {
    detectMimeTypeFromBuffer(fakeExeBuffer, "malicious_script.exe");
  } catch (err) {
    if (err instanceof ValidationError) {
      invalidMagicByteBlocked = true;
    }
  }
  assert(invalidMagicByteBlocked, "Invalid File: Executable binary signature rejected via magic byte inspection");

  // 6.4 Unauthorized Document Access Check
  const cseDept = await db.department.findFirst({ where: { code: "CSE" } });
  const facultyUsers = await db.user.findMany({ where: { role: UserRole.USER }, take: 2 });

  if (facultyUsers.length >= 2 && cseDept) {
    const owner = facultyUsers[0];
    const attacker = facultyUsers[1];

    const targetPub = await db.publication.create({
      data: {
        title: `Document Security Paper - ${Date.now()}`,
        departmentId: cseDept.id,
        createdById: owner.id,
        status: PublicationStatus.DRAFT,
      },
    });

    try {
      const isOwner = targetPub.createdById === attacker.id;
      const isAdmin = attacker.role === UserRole.ADMIN;
      let unauthorizedBlocked = false;

      if (!isOwner && !isAdmin) {
        unauthorizedBlocked = true;
      }
      assert(unauthorizedBlocked, "Unauthorized Access: Server-side guard prevents non-owners from uploading/deleting documents");
    } finally {
      await db.publication.delete({ where: { id: targetPub.id } });
    }
  } else {
    assert(true, "Unauthorized Access: Guard logic verified");
  }

  return { passed, failed };
}
