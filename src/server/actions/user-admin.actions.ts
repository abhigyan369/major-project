"use server";

import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import {
  adminCreateUserSchema,
  AdminCreateUserInput,
  adminUpdateUserSchema,
  AdminUpdateUserInput,
  changeUserRoleSchema,
  ChangeUserRoleInput,
  changeUserStatusSchema,
  ChangeUserStatusInput,
} from "@/validators/user";
import { AuditAction, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore in non-HTTP CLI test contexts
  }
}

export async function adminCreateUserAction(input: AdminCreateUserInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = adminCreateUserSchema.parse(input);

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      return {
        success: false,
        error: "A user with this email address already exists.",
      };
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const newUser = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        departmentId: validated.departmentId || null,
        designation: validated.designation || null,
        role: validated.role,
        status: validated.status,
      },
      include: {
        department: true,
      },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.USER_CREATE,
        entityType: "User",
        entityId: newUser.id,
        details: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          designation: newUser.designation,
          departmentId: newUser.departmentId,
        },
      },
    });

    safeRevalidatePath("/admin/users");
    return { success: true, user: newUser };
  } catch (error: unknown) {
    logger.error("adminCreateUserAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user.",
    };
  }
}

export async function adminUpdateUserAction(input: AdminUpdateUserInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = adminUpdateUserSchema.parse(input);

    const existingUser = await db.user.findUnique({
      where: { id: validated.id },
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    // Check email uniqueness if email changed
    if (validated.email.toLowerCase() !== existingUser.email) {
      const emailConflict = await db.user.findUnique({
        where: { email: validated.email.toLowerCase() },
      });
      if (emailConflict) {
        return { success: false, error: "This email address is already in use by another account." };
      }
    }

    // Protect against demoting oneself
    if (adminUser.id === validated.id && validated.role !== UserRole.ADMIN) {
      return { success: false, error: "You cannot revoke your own administrator role." };
    }

    const updatedUser = await db.user.update({
      where: { id: validated.id },
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        departmentId: validated.departmentId || null,
        designation: validated.designation || null,
        role: validated.role,
        status: validated.status,
      },
      include: {
        department: true,
      },
    });

    // Record Audit Log
    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.USER_UPDATE,
        entityType: "User",
        entityId: updatedUser.id,
        details: {
          previousName: existingUser.name,
          newName: updatedUser.name,
          previousEmail: existingUser.email,
          newEmail: updatedUser.email,
          previousRole: existingUser.role,
          newRole: updatedUser.role,
          previousStatus: existingUser.status,
          newStatus: updatedUser.status,
        },
      },
    });

    safeRevalidatePath("/admin/users");
    safeRevalidatePath(`/admin/users/${updatedUser.id}`);
    return { success: true, user: updatedUser };
  } catch (error: unknown) {
    logger.error("adminUpdateUserAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user.",
    };
  }
}

export async function toggleUserStatusAction(input: ChangeUserStatusInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = changeUserStatusSchema.parse(input);

    if (adminUser.id === validated.userId && validated.status !== UserStatus.ACTIVE) {
      return { success: false, error: "You cannot deactivate or suspend your own administrator account." };
    }

    const existingUser = await db.user.findUnique({
      where: { id: validated.userId },
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    const updatedUser = await db.user.update({
      where: { id: validated.userId },
      data: { status: validated.status },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.USER_UPDATE,
        entityType: "User",
        entityId: updatedUser.id,
        details: {
          actionType: "STATUS_CHANGE",
          previousStatus: existingUser.status,
          newStatus: updatedUser.status,
        },
      },
    });

    safeRevalidatePath("/admin/users");
    safeRevalidatePath(`/admin/users/${updatedUser.id}`);
    return { success: true, status: updatedUser.status };
  } catch (error: unknown) {
    logger.error("toggleUserStatusAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change user status.",
    };
  }
}

export async function changeUserRoleAction(input: ChangeUserRoleInput) {
  try {
    const adminUser = await requireAdmin();
    const validated = changeUserRoleSchema.parse(input);

    if (adminUser.id === validated.userId && validated.role !== UserRole.ADMIN) {
      return { success: false, error: "You cannot revoke your own administrator role." };
    }

    const existingUser = await db.user.findUnique({
      where: { id: validated.userId },
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    const updatedUser = await db.user.update({
      where: { id: validated.userId },
      data: { role: validated.role },
    });

    await db.auditLog.create({
      data: {
        userId: adminUser.id,
        action: AuditAction.USER_UPDATE,
        entityType: "User",
        entityId: updatedUser.id,
        details: {
          actionType: "ROLE_CHANGE",
          previousRole: existingUser.role,
          newRole: updatedUser.role,
        },
      },
    });

    safeRevalidatePath("/admin/users");
    safeRevalidatePath(`/admin/users/${updatedUser.id}`);
    return { success: true, role: updatedUser.role };
  } catch (error: unknown) {
    logger.error("changeUserRoleAction error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change user role.",
    };
  }
}
