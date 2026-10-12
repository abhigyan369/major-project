import db from "@/lib/db";
import {
  adminCreateUserAction,
  adminUpdateUserAction,
  toggleUserStatusAction,
  changeUserRoleAction,
} from "@/server/actions/user-admin.actions";
import {
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
  deleteOrMigrateDepartmentAction,
} from "@/server/actions/department.actions";
import { UserRole, UserStatus, FacultyDesignation, AuditAction } from "@prisma/client";

async function runPhase8VerificationTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING PHASE 8: ADMIN USER & DEPARTMENT TEST");
  console.log("=================================================\n");

  // Fetch admin user for session context
  const adminUser = await db.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!adminUser) {
    throw new Error("❌ Error: No Admin user found in database for testing.");
  }

  process.env.TEST_ADMIN_BYPASS = "true";

  const southCampus = await db.campus.findUnique({ where: { code: "SOUTH" } });
  if (!southCampus) {
    throw new Error("❌ Error: South Campus not found.");
  }

  // ----------------------------------------------------------------------
  // 1. TEST USER MANAGEMENT ACTIONS
  // ----------------------------------------------------------------------
  console.log("1️⃣  Testing User Management Actions...");

  // 1.1 Create Test User
  const testEmail = `test.faculty.${Date.now()}@nie.ac.in`;
  const createRes = await adminCreateUserAction({
    name: "Dr. Phase8 Test Faculty",
    email: testEmail,
    password: "password123",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    designation: FacultyDesignation.ASSISTANT_PROFESSOR,
  });

  if (!createRes.success || !createRes.user) {
    throw new Error(`❌ User creation failed: ${createRes.error}`);
  }
  console.log(" ✅ PASS: Admin successfully created user account:", createRes.user.email);

  const createdUserId = createRes.user.id;

  // 1.2 Update User Profile, Designation, and Department
  const cseDept = await db.department.findUnique({ where: { code: "CSE" } });
  const updateRes = await adminUpdateUserAction({
    id: createdUserId,
    name: "Dr. Phase8 Updated Faculty",
    email: testEmail,
    departmentId: cseDept?.id || null,
    designation: FacultyDesignation.ASSOCIATE_PROFESSOR,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  if (!updateRes.success || !updateRes.user) {
    throw new Error(`❌ User update failed: ${updateRes.error}`);
  }
  if (
    updateRes.user.name !== "Dr. Phase8 Updated Faculty" ||
    updateRes.user.designation !== FacultyDesignation.ASSOCIATE_PROFESSOR ||
    updateRes.user.departmentId !== cseDept?.id
  ) {
    throw new Error("❌ User update attributes mismatch.");
  }
  console.log(" ✅ PASS: Admin updated user profile, designation, and department assignment.");

  // 1.3 Toggle User Status (Deactivate / Reactivate)
  const deactRes = await toggleUserStatusAction({
    userId: createdUserId,
    status: UserStatus.INACTIVE,
  });
  if (!deactRes.success || deactRes.status !== UserStatus.INACTIVE) {
    throw new Error(`❌ User deactivation failed: ${deactRes.error}`);
  }
  console.log(" ✅ PASS: Admin successfully deactivated user account.");

  const reactRes = await toggleUserStatusAction({
    userId: createdUserId,
    status: UserStatus.ACTIVE,
  });
  if (!reactRes.success || reactRes.status !== UserStatus.ACTIVE) {
    throw new Error(`❌ User reactivation failed: ${reactRes.error}`);
  }
  console.log(" ✅ PASS: Admin successfully reactivated user account.");

  // 1.4 Change User Role
  const roleRes = await changeUserRoleAction({
    userId: createdUserId,
    role: UserRole.ADMIN,
  });
  if (!roleRes.success || roleRes.role !== UserRole.ADMIN) {
    throw new Error(`❌ User role change failed: ${roleRes.error}`);
  }
  console.log(" ✅ PASS: Admin successfully elevated user to ADMIN role.");

  // Revert user role to USER
  await changeUserRoleAction({
    userId: createdUserId,
    role: UserRole.USER,
  });

  // ----------------------------------------------------------------------
  // 2. TEST DEPARTMENT MANAGEMENT ACTIONS
  // ----------------------------------------------------------------------
  console.log("\n2️⃣  Testing Department Management Actions...");

  // 2.1 Create New Department
  const tempDeptCode = `TEST${Math.floor(Math.random() * 1000)}`;
  const deptCreateRes = await createDepartmentAction({
    code: tempDeptCode,
    name: `Department of Automated Testing ${tempDeptCode}`,
    campusId: southCampus.id,
    facultyCount: 25,
    targetPerFaculty: 3.5,
    isActive: true,
  });

  if (!deptCreateRes.success || !deptCreateRes.department) {
    throw new Error(`❌ Department creation failed: ${deptCreateRes.error}`);
  }
  console.log(" ✅ PASS: Created new department:", deptCreateRes.department.code);

  const testDeptId = deptCreateRes.department.id;

  // 2.2 Edit Department
  const deptUpdateRes = await updateDepartmentAction({
    id: testDeptId,
    code: tempDeptCode,
    name: `Department of Updated Testing ${tempDeptCode}`,
    campusId: southCampus.id,
    facultyCount: 30,
    targetPerFaculty: 4.0,
    isActive: true,
  });
  if (!deptUpdateRes.success || !deptUpdateRes.department) {
    throw new Error(`❌ Department update failed: ${deptUpdateRes.error}`);
  }
  if (
    deptUpdateRes.department.facultyCount !== 30 ||
    deptUpdateRes.department.targetPerFaculty !== 4.0
  ) {
    throw new Error("❌ Department update properties mismatch.");
  }
  console.log(" ✅ PASS: Admin updated department faculty count & publication targets.");

  // 2.3 Toggle Department Active Status
  const toggleDeptRes = await toggleDepartmentStatusAction({
    id: testDeptId,
    isActive: false,
  });
  if (!toggleDeptRes.success || toggleDeptRes.isActive !== false) {
    throw new Error(`❌ Toggle department status failed: ${toggleDeptRes.error}`);
  }
  console.log(" ✅ PASS: Admin deactivated department.");

  // 2.4 Reassign user to test department & verify deletion safeguard
  await db.user.update({
    where: { id: createdUserId },
    data: { departmentId: testDeptId },
  });

  // Attempt direct deletion without target department -> should fail safeguard
  const directDeleteRes = await deleteOrMigrateDepartmentAction({
    departmentId: testDeptId,
    targetDepartmentId: null,
  });
  if (directDeleteRes.success || !directDeleteRes.requiresMigration) {
    throw new Error("❌ Safeguard failed: Department with attached user was deleted without migration.");
  }
  console.log(" ✅ PASS: Deletion safeguard correctly blocked deleting department with dependent records.");

  // Perform migration of user to CSE department and delete test department
  const migrationRes = await deleteOrMigrateDepartmentAction({
    departmentId: testDeptId,
    targetDepartmentId: cseDept!.id,
  });
  if (!migrationRes.success) {
    throw new Error(`❌ Migration & deletion failed: ${migrationRes.error}`);
  }
  console.log(" ✅ PASS: Successfully migrated attached user records to CSE and deleted test department.");

  // Clean up created test user
  await db.user.delete({ where: { id: createdUserId } });

  // ----------------------------------------------------------------------
  // 3. VERIFY AUDIT LOG RECORDING
  // ----------------------------------------------------------------------
  console.log("\n3️⃣  Verifying Audit Log Records...");

  const userLogs = await db.auditLog.findMany({
    where: {
      action: { in: [AuditAction.USER_CREATE, AuditAction.USER_UPDATE, AuditAction.DEPARTMENT_CREATE, AuditAction.DEPARTMENT_UPDATE, AuditAction.DEPARTMENT_DELETE] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (userLogs.length < 5) {
    throw new Error(`❌ Expected at least 5 audit log entries, found ${userLogs.length}`);
  }
  console.log(` ✅ PASS: Verified ${userLogs.length} audit log entries for user and department actions.`);

  console.log("\n=================================================");
  console.log("🏁 PHASE 8 VERIFICATION COMPLETE: ALL TESTS PASSED!");
  console.log("=================================================");
}

runPhase8VerificationTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
