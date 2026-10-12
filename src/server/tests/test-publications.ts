import db from "@/lib/db";
import {
  createPublicationAction,
  updatePublicationAction,
  submitPublicationAction,
  requestChangesAction,
  approvePublicationAction,
  rejectPublicationAction,
} from "@/server/actions/publication.actions";
import { UserRole, PublicationStatus } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

export async function testPublicationsLifecycleSuite() {
  console.log("\n=================================================");
  console.log("📚 2. TESTING PUBLICATIONS LIFECYCLE & WORKFLOW");
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

  process.env.TEST_ADMIN_BYPASS = "true";
  process.env.TEST_AUTH_BYPASS = "true";

  const faculty = await db.user.findFirst({ where: { role: UserRole.USER } });
  const cseDept = await db.department.findFirst({ where: { code: "CSE" } });

  if (!faculty || !cseDept) {
    throw new Error("❌ Prerequisite faculty or department record missing for testing.");
  }

  let createdPubId: string | null = null;
  let rejectedPubId: string | null = null;

  try {
    // 2.1 Create Draft Publication
    const draftRes = await createPublicationAction({
      title: `Draft Paper Test - ${Date.now()}`,
      rawAuthors: faculty.name || faculty.email || "Dr. Test Author",
      departmentId: cseDept.id,
      actionType: "draft",
    });

    assert(draftRes.success && !!draftRes.publication, "Create: Draft publication created successfully");
    if (draftRes.publication) {
      createdPubId = draftRes.publication.id;
      assert(draftRes.publication.status === PublicationStatus.DRAFT, "Draft: Initial status is DRAFT");
    }

    // 2.2 Edit Draft Publication
    if (createdPubId) {
      const updatedTitle = `Updated Draft Title - ${Date.now()}`;
      const editRes = await updatePublicationAction(createdPubId, {
        title: updatedTitle,
      });

      assert(editRes.success && editRes.publication.title === updatedTitle, "Edit: Draft publication edited successfully");
    }

    // 2.3 Submit Draft Publication
    if (createdPubId) {
      const submitRes = await submitPublicationAction(createdPubId);
      assert(submitRes.success && submitRes.publication.status === PublicationStatus.SUBMITTED, "Submit: Transitioned DRAFT -> SUBMITTED");
    }

    // 2.4 Revision Request by Admin
    if (createdPubId) {
      const revRes = await requestChangesAction(createdPubId, "Please add more references and revise section 3.");
      assert(revRes.success, "Revision: Admin requested changes");

      const pubAfterRev = await db.publication.findUnique({ where: { id: createdPubId } });
      assert(pubAfterRev?.status === PublicationStatus.REVISION_REQUIRED, "Revision: Status transitioned to REVISION_REQUIRED");

      // Edit while REVISION_REQUIRED and re-submit
      const revisedTitle = `Revised Paper Title - ${Date.now()}`;
      const editRevRes = await updatePublicationAction(createdPubId, {
        title: revisedTitle,
        actionType: "submit",
      });
      assert(editRevRes.success && editRevRes.publication.status === PublicationStatus.SUBMITTED, "Revision: Author edited and re-submitted revised paper");
    }

    // 2.5 Admin Approval
    if (createdPubId) {
      const appRes = await approvePublicationAction(createdPubId, "Approved after thorough revision.");
      assert(appRes.success, "Approval: Admin approved publication");

      const pubAfterApp = await db.publication.findUnique({ where: { id: createdPubId } });
      assert(pubAfterApp?.status === PublicationStatus.APPROVED || pubAfterApp?.status === PublicationStatus.PUBLISHED, "Approval: Status transitioned to APPROVED/PUBLISHED");

      // Verify editing is blocked once approved
      let blockedApprovedEdit = false;
      try {
        await updatePublicationAction(createdPubId, { title: "Attempt edit on approved" });
      } catch (err) {
        if (err instanceof ForbiddenError) {
          blockedApprovedEdit = true;
        }
      }
      assert(blockedApprovedEdit, "Edit Restriction: Prevented editing publication once APPROVED");
    }

    // 2.6 Admin Rejection Workflow
    const rejectTargetRes = await createPublicationAction({
      title: `Paper to Reject Test - ${Date.now()}`,
      rawAuthors: faculty.name || faculty.email || "Dr. Test Author",
      departmentId: cseDept.id,
      actionType: "submit",
    });

    if (rejectTargetRes.publication) {
      rejectedPubId = rejectTargetRes.publication.id;
      const rejRes = await rejectPublicationAction(rejectedPubId, "Does not meet publication standards.");
      assert(rejRes.success, "Rejection: Admin rejected publication");

      const pubAfterRej = await db.publication.findUnique({ where: { id: rejectedPubId } });
      assert(pubAfterRej?.status === PublicationStatus.REJECTED, "Rejection: Status transitioned to REJECTED");
    }

  } finally {
    // Clean up created test publications
    const toDelete = [createdPubId, rejectedPubId].filter(Boolean) as string[];
    if (toDelete.length > 0) {
      await db.publication.deleteMany({
        where: { id: { in: toDelete } },
      });
    }
  }

  return { passed, failed };
}
