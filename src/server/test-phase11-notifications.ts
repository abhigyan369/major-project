import db from "@/lib/db";
import {
  createPublicationAction,
  submitPublicationAction,
  requestChangesAction,
  approvePublicationAction,
  rejectPublicationAction,
} from "@/server/actions/publication.actions";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/actions/notification.actions";
import { UserRole, NotificationType, PublicationStatus } from "@prisma/client";

async function runPhase11NotificationTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 11: NOTIFICATION SYSTEM TESTS");
  console.log("=================================================\n");

  // Fetch test users
  const adminUser = await db.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
  const facultyUser = await db.user.findFirst({
    where: { role: UserRole.USER },
  });
  const cseDept = await db.department.findFirst({
    where: { code: "CSE" },
  });

  if (!adminUser || !facultyUser || !cseDept) {
    throw new Error("❌ Required database records (Admin, Faculty, CSE Department) not found.");
  }

  process.env.TEST_ADMIN_BYPASS = "true";
  process.env.TEST_AUTH_BYPASS = "true";

  // Cleanup existing notifications for clean test assertions
  await db.notification.deleteMany({
    where: {
      userId: { in: [facultyUser.id, adminUser.id] },
    },
  });

  // ----------------------------------------------------------------------
  // 1. TEST PUBLICATION SUBMISSION NOTIFICATIONS
  // ----------------------------------------------------------------------
  console.log("1️⃣  Testing Publication Submission Notifications (User & Admin)...");

  // Create publication directly in SUBMITTED state
  const pubTitle = `Test Paper Phase 11 - ${Date.now()}`;
  const createRes = await createPublicationAction({
    title: pubTitle,
    departmentId: cseDept.id,
    actionType: "submit",
  });

  if (!createRes.success || !createRes.publication) {
    throw new Error("❌ Failed to create publication with submit action.");
  }

  const pubId = createRes.publication.id;

  // Check notifications for Faculty User
  const facultyNotifs = await db.notification.findMany({
    where: { userId: facultyUser.id, publicationId: pubId },
  });

  if (facultyNotifs.length === 0) {
    throw new Error("❌ Submitting user did NOT receive a publication submission notification.");
  }
  if (facultyNotifs[0].type !== NotificationType.PUBLICATION_SUBMITTED) {
    throw new Error(`❌ Expected PUBLICATION_SUBMITTED type, found ${facultyNotifs[0].type}`);
  }
  console.log(" ✅ PASS: Submitting user received 'PUBLICATION_SUBMITTED' notification.");

  // Check notifications for Admin User
  const adminNotifs = await db.notification.findMany({
    where: { userId: adminUser.id, publicationId: pubId },
  });

  if (adminNotifs.length === 0) {
    throw new Error("❌ Admin did NOT receive a new publication submitted notification.");
  }
  if (adminNotifs[0].type !== NotificationType.PUBLICATION_SUBMITTED) {
    throw new Error(`❌ Expected PUBLICATION_SUBMITTED type for admin, found ${adminNotifs[0].type}`);
  }
  console.log(" ✅ PASS: Admin received 'New Publication Submitted' notification.");

  // ----------------------------------------------------------------------
  // 2. TEST ADMIN REQUEST CHANGES NOTIFICATION
  // ----------------------------------------------------------------------
  console.log("\n2️⃣  Testing Admin Request Changes Notification...");

  const reqChangesRes = await requestChangesAction(pubId, "Please fix abstract formatting and add grant details.");
  if (!reqChangesRes.success) {
    throw new Error("❌ Admin request changes action failed.");
  }

  const userReqChangesNotif = await db.notification.findFirst({
    where: {
      userId: facultyUser.id,
      publicationId: pubId,
      type: NotificationType.CHANGES_REQUESTED,
    },
  });

  if (!userReqChangesNotif) {
    throw new Error("❌ User did NOT receive 'CHANGES_REQUESTED' notification.");
  }
  console.log(" ✅ PASS: User received 'CHANGES_REQUESTED' notification:", userReqChangesNotif.title);

  // Re-submit publication
  await submitPublicationAction(pubId);

  // ----------------------------------------------------------------------
  // 3. TEST ADMIN APPROVAL NOTIFICATION
  // ----------------------------------------------------------------------
  console.log("\n3️⃣  Testing Admin Approval Notification...");

  const approveRes = await approvePublicationAction(pubId, "Paper is well formatted and meets research guidelines.");
  if (!approveRes.success) {
    throw new Error("❌ Admin approve publication action failed.");
  }

  const userApprovedNotif = await db.notification.findFirst({
    where: {
      userId: facultyUser.id,
      publicationId: pubId,
      type: NotificationType.PUBLICATION_APPROVED,
    },
  });

  if (!userApprovedNotif) {
    throw new Error("❌ User did NOT receive 'PUBLICATION_APPROVED' notification.");
  }
  console.log(" ✅ PASS: User received 'PUBLICATION_APPROVED' notification:", userApprovedNotif.title);

  // ----------------------------------------------------------------------
  // 4. TEST ADMIN REJECTION NOTIFICATION
  // ----------------------------------------------------------------------
  console.log("\n4️⃣  Testing Admin Rejection Notification...");

  // Create another test publication to reject
  const pubTitle2 = `Test Paper Phase 11 Rejection - ${Date.now()}`;
  const createRes2 = await createPublicationAction({
    title: pubTitle2,
    departmentId: cseDept.id,
    actionType: "submit",
  });
  const pubId2 = createRes2.publication!.id;

  const rejectRes = await rejectPublicationAction(pubId2, "Duplicate submission detected.");
  if (!rejectRes.success) {
    throw new Error("❌ Admin reject publication action failed.");
  }

  const userRejectedNotif = await db.notification.findFirst({
    where: {
      userId: facultyUser.id,
      publicationId: pubId2,
      type: NotificationType.PUBLICATION_REJECTED,
    },
  });

  if (!userRejectedNotif) {
    throw new Error("❌ User did NOT receive 'PUBLICATION_REJECTED' notification.");
  }
  console.log(" ✅ PASS: User received 'PUBLICATION_REJECTED' notification:", userRejectedNotif.title);

  // ----------------------------------------------------------------------
  // 5. TEST NOTIFICATION ACTIONS (GET, MARK AS READ, MARK ALL AS READ)
  // ----------------------------------------------------------------------
  console.log("\n5️⃣  Testing Notification Server Actions (Get & Mark Read)...");

  // Query notifications for user
  const getUserNotifsRes = await getUserNotificationsAction(10);
  if (!getUserNotifsRes.success || getUserNotifsRes.notifications.length === 0) {
    throw new Error("❌ getUserNotificationsAction returned empty or failed.");
  }

  const initialUnreadCount = getUserNotifsRes.unreadCount;
  if (initialUnreadCount === 0) {
    throw new Error("❌ Expected unread notifications, found 0.");
  }
  console.log(` ✅ PASS: getUserNotificationsAction returned ${getUserNotifsRes.notifications.length} items (${initialUnreadCount} unread).`);

  // Test single mark as read
  const targetNotifId = getUserNotifsRes.notifications[0].id;
  const markSingleRes = await markNotificationAsReadAction(targetNotifId);
  if (!markSingleRes.success || !markSingleRes.notification?.isRead) {
    throw new Error("❌ markNotificationAsReadAction failed.");
  }
  console.log(" ✅ PASS: Successfully marked single notification as read.");

  // Test mark all as read
  const markAllRes = await markAllNotificationsAsReadAction();
  if (!markAllRes.success) {
    throw new Error("❌ markAllNotificationsAsReadAction failed.");
  }

  const afterMarkAllRes = await getUserNotificationsAction(10);
  if (afterMarkAllRes.unreadCount !== 0) {
    throw new Error(`❌ Expected 0 unread notifications after markAllAsRead, found ${afterMarkAllRes.unreadCount}`);
  }
  console.log(" ✅ PASS: markAllNotificationsAsReadAction successfully cleared all unread states.");

  // Clean up created test publications
  await db.publication.deleteMany({
    where: { id: { in: [pubId, pubId2] } },
  });

  console.log("\n=================================================");
  console.log("🏁 PHASE 11 VERIFICATION COMPLETE: ALL TESTS PASSED!");
  console.log("=================================================");
}

runPhase11NotificationTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
