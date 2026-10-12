"use server";

import db from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { updateUserProfileSchema, UpdateUserProfileInput } from "@/validators/user";
import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateUserProfileAction(input: UpdateUserProfileInput) {
  const currentUser = await requireAuth();

  const validated = updateUserProfileSchema.parse(input);

  const updatedUser = await db.user.update({
    where: { id: currentUser.id },
    data: {
      name: validated.name,
      designation: validated.designation || undefined,
      departmentId: validated.departmentId || undefined,
    },
    include: {
      department: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: currentUser.id,
      action: AuditAction.USER_UPDATE,
      entityType: "User",
      entityId: currentUser.id,
      details: {
        name: updatedUser.name,
        designation: updatedUser.designation,
        departmentId: updatedUser.departmentId,
      },
    },
  });

  revalidatePath("/user/profile");
  revalidatePath("/user/dashboard");
  return { success: true, user: updatedUser };
}
