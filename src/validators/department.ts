import { z } from "zod";

export const createDepartmentSchema = z.object({
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters long")
    .max(10, "Department code must not exceed 10 characters")
    .toUpperCase(),
  name: z.string().min(3, "Department name must be at least 3 characters long"),
  campusId: z.string().min(1, "Campus selection is required"),
  facultyCount: z.coerce
    .number()
    .int("Faculty count must be an integer")
    .min(0, "Faculty count cannot be negative"),
  targetPerFaculty: z.coerce
    .number()
    .min(0, "Target per faculty cannot be negative")
    .default(3.0),
  isActive: z.boolean().default(true),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters long")
    .max(10, "Department code must not exceed 10 characters")
    .toUpperCase(),
  name: z.string().min(3, "Department name must be at least 3 characters long"),
  campusId: z.string().min(1, "Campus selection is required"),
  facultyCount: z.coerce
    .number()
    .int("Faculty count must be an integer")
    .min(0, "Faculty count cannot be negative"),
  targetPerFaculty: z.coerce
    .number()
    .min(0, "Target per faculty cannot be negative"),
  isActive: z.boolean(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const toggleDepartmentStatusSchema = z.object({
  id: z.string().min(1, "Department ID is required"),
  isActive: z.boolean(),
});

export type ToggleDepartmentStatusInput = z.infer<typeof toggleDepartmentStatusSchema>;

export const deleteOrMigrateDepartmentSchema = z.object({
  departmentId: z.string().min(1, "Department ID is required"),
  targetDepartmentId: z.string().optional().nullable(),
});

export type DeleteOrMigrateDepartmentInput = z.infer<typeof deleteOrMigrateDepartmentSchema>;
