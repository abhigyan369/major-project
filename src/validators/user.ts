import { z } from "zod";
import { FacultyDesignation, UserRole, UserStatus } from "@prisma/client";

export const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  designation: z.nativeEnum(FacultyDesignation).optional().nullable(),
  departmentId: z.string().optional().nullable(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export const adminCreateUserSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  departmentId: z.string().optional().nullable(),
  designation: z.nativeEnum(FacultyDesignation).optional().nullable(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  departmentId: z.string().optional().nullable(),
  designation: z.nativeEnum(FacultyDesignation).optional().nullable(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const changeUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.nativeEnum(UserRole),
});

export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;

export const changeUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.nativeEnum(UserStatus),
});

export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;

