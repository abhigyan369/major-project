"use client";

import React, { useState, useTransition } from "react";
import { DepartmentFilters } from "./department-filters";
import { DepartmentTable, DepartmentItem } from "./department-table";
import { CreateDepartmentModal } from "./create-department-modal";
import { EditDepartmentModal } from "./edit-department-modal";
import { DepartmentMigrationModal } from "./department-migration-modal";
import { toggleDepartmentStatusAction } from "@/server/actions/department.actions";

interface DepartmentsClientWrapperProps {
  departments: DepartmentItem[];
  campuses: Array<{ id: string; code: string; name: string }>;
}

export function DepartmentsClientWrapper({
  departments,
  campuses,
}: DepartmentsClientWrapperProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);
  const [, startTransition] = useTransition();

  function handleToggleStatus(dept: DepartmentItem) {
    startTransition(async () => {
      await toggleDepartmentStatusAction({
        id: dept.id,
        isActive: !dept.isActive,
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <DepartmentFilters
        campuses={campuses}
        totalDepartments={departments.length}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Department Table */}
      <DepartmentTable
        departments={departments}
        onEdit={(dept) => setEditingDept(dept)}
        onToggleStatus={handleToggleStatus}
        onDelete={(dept) => setDeletingDept(dept)}
      />

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        campuses={campuses}
      />

      {/* Edit Department Modal */}
      <EditDepartmentModal
        department={editingDept}
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        campuses={campuses}
      />

      {/* Migration & Deletion Modal */}
      <DepartmentMigrationModal
        department={deletingDept}
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        allDepartments={departments}
      />
    </div>
  );
}
