"use server";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import {
  createDepartmentSchema,
  CreateDepartmentInput,
  updateDepartmentSchema,
  UpdateDepartmentInput,
  toggleDepartmentStatusSchema,
  ToggleDepartmentStatusInput,
  deleteOrMigrateDepartmentSchema,
  DeleteOrMigrateDepartmentInput,
} from "@/validators/department";
import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore in non-HTTP CLI test contexts
  }
}

export async function createDepartmentAction(input: CreateDepartmentInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = createDepartmentSchema.parse(input);

    // Check code or name uniqueness
    const codeConflict = await db.department.findUnique({
      where: { code: validated.code },
    });
    if (codeConflict) {
      return { success: false, error: `Department code '${validated.code}' already exists.` };
    }

    const nameConflict = await db.department.findUnique({
      where: { name: validated.name },
    });
    if (nameConflict) {
      return { success: false, error: `Department name '${validated.name}' already exists.` };
    }

    const newDepartment = await db.department.create({
      data: {
        code: validated.code,
        name: validated.name,
        campusId: validated.campusId,
        facultyCount: validated.facultyCount,
        targetPerFaculty: validated.targetPerFaculty,
        isActive: validated.isActive,
      },
      include: {
        campus: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.DEPARTMENT_CREATE,
        entityType: "Department",
        entityId: newDepartment.id,
        details: {
          code: newDepartment.code,
          name: newDepartment.name,
          campus: newDepartment.campus.name,
          facultyCount: newDepartment.facultyCount,
          targetPerFaculty: newDepartment.targetPerFaculty,
        },
      },
    });

    safeRevalidatePath("/admin/departments");
    return { success: true, department: newDepartment };
  } catch (error: unknown) {
    logger.error("createDepartmentAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create department.",
    };
  }
}

export async function updateDepartmentAction(input: UpdateDepartmentInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = updateDepartmentSchema.parse(input);

    const existing = await db.department.findUnique({
      where: { id: validated.id },
    });
    if (!existing) {
      return { success: false, error: "Department not found." };
    }

    // Check uniqueness if code or name changed
    if (validated.code !== existing.code) {
      const codeConflict = await db.department.findUnique({
        where: { code: validated.code },
      });
      if (codeConflict) {
        return { success: false, error: `Department code '${validated.code}' is already used by another department.` };
      }
    }

    if (validated.name !== existing.name) {
      const nameConflict = await db.department.findUnique({
        where: { name: validated.name },
      });
      if (nameConflict) {
        return { success: false, error: `Department name '${validated.name}' is already used by another department.` };
      }
    }

    const updatedDepartment = await db.department.update({
      where: { id: validated.id },
      data: {
        code: validated.code,
        name: validated.name,
        campusId: validated.campusId,
        facultyCount: validated.facultyCount,
        targetPerFaculty: validated.targetPerFaculty,
        isActive: validated.isActive,
      },
      include: {
        campus: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.DEPARTMENT_UPDATE,
        entityType: "Department",
        entityId: updatedDepartment.id,
        details: {
          previousCode: existing.code,
          newCode: updatedDepartment.code,
          previousName: existing.name,
          newName: updatedDepartment.name,
          facultyCount: updatedDepartment.facultyCount,
          targetPerFaculty: updatedDepartment.targetPerFaculty,
          isActive: updatedDepartment.isActive,
        },
      },
    });

    safeRevalidatePath("/admin/departments");
    return { success: true, department: updatedDepartment };
  } catch (error: unknown) {
    logger.error("updateDepartmentAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update department.",
    };
  }
}

export async function toggleDepartmentStatusAction(input: ToggleDepartmentStatusInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = toggleDepartmentStatusSchema.parse(input);

    const existing = await db.department.findUnique({
      where: { id: validated.id },
    });
    if (!existing) {
      return { success: false, error: "Department not found." };
    }

    const updated = await db.department.update({
      where: { id: validated.id },
      data: { isActive: validated.isActive },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.DEPARTMENT_UPDATE,
        entityType: "Department",
        entityId: updated.id,
        details: {
          actionType: "STATUS_TOGGLE",
          previousIsActive: existing.isActive,
          newIsActive: updated.isActive,
        },
      },
    });

    safeRevalidatePath("/admin/departments");
    return { success: true, isActive: updated.isActive };
  } catch (error: unknown) {
    logger.error("toggleDepartmentStatusAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle department active status.",
    };
  }
}

export async function deleteOrMigrateDepartmentAction(input: DeleteOrMigrateDepartmentInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = deleteOrMigrateDepartmentSchema.parse(input);

    const sourceDept = await db.department.findUnique({
      where: { id: validated.departmentId },
      include: {
        _count: {
          select: {
            publications: true,
            users: true,
          },
        },
      },
    });

    if (!sourceDept) {
      return { success: false, error: "Source department not found." };
    }

    const publicationCount = sourceDept._count.publications;
    const userCount = sourceDept._count.users;

    // Check if migration is required
    if (publicationCount > 0 || userCount > 0) {
      if (!validated.targetDepartmentId) {
        return {
          success: false,
          requiresMigration: true,
          publicationCount,
          userCount,
          error: `Department '${sourceDept.code}' cannot be deleted directly because ${publicationCount} publication(s) and ${userCount} user(s) depend on it. Please select a target department to migrate these records.`,
        };
      }

      if (validated.targetDepartmentId === validated.departmentId) {
        return {
          success: false,
          error: "Target department for migration cannot be the same as the department being deleted.",
        };
      }

      const targetDept = await db.department.findUnique({
        where: { id: validated.targetDepartmentId },
      });

      if (!targetDept) {
        return { success: false, error: "Selected target department for migration does not exist." };
      }

      // Execute migration & deletion in a transaction
      await db.$transaction(async (tx) => {
        // Reassign users
        if (userCount > 0) {
          await tx.user.updateMany({
            where: { departmentId: sourceDept.id },
            data: { departmentId: targetDept.id },
          });
        }

        // Reassign publications
        if (publicationCount > 0) {
          await tx.publication.updateMany({
            where: { departmentId: sourceDept.id },
            data: { departmentId: targetDept.id },
          });
        }

        // Delete source department
        await tx.department.delete({
          where: { id: sourceDept.id },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            userId: adminUser.id,
            action: AuditAction.DEPARTMENT_DELETE,
            entityType: "Department",
            entityId: sourceDept.id,
            details: {
              deletedDepartmentCode: sourceDept.code,
              deletedDepartmentName: sourceDept.name,
              migratedToDepartmentCode: targetDept.code,
              migratedToDepartmentName: targetDept.name,
              migratedPublicationsCount: publicationCount,
              migratedUsersCount: userCount,
            },
          },
        });
      });

      safeRevalidatePath("/admin/departments");
      safeRevalidatePath("/admin/users");
      safeRevalidatePath("/admin/publications");
      return {
        success: true,
        migrated: true,
        message: `Successfully migrated ${publicationCount} publication(s) and ${userCount} user(s) to '${targetDept.code}' and deleted '${sourceDept.code}'.`,
      };
    }

    // Zero dependencies - simple delete
    await db.department.delete({
      where: { id: sourceDept.id },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.DEPARTMENT_DELETE,
        entityType: "Department",
        entityId: sourceDept.id,
        details: {
          deletedDepartmentCode: sourceDept.code,
          deletedDepartmentName: sourceDept.name,
          dependencies: 0,
        },
      },
    });

    safeRevalidatePath("/admin/departments");
    return { success: true, migrated: false, message: `Department '${sourceDept.code}' deleted successfully.` };
  } catch (error: unknown) {
    logger.error("deleteOrMigrateDepartmentAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete department.",
    };
  }
}
