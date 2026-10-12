"use client";

import React, { useState } from "react";
import { UserFilters } from "./user-filters";
import { UserTable, UserItem } from "./user-table";
import { CreateUserModal } from "./create-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { UserStatusModal } from "./user-status-modal";
import { UserRoleModal } from "./user-role-modal";

interface UsersClientWrapperProps {
  users: UserItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  departments: Array<{ id: string; code: string; name: string }>;
}

export function UsersClientWrapper({
  users,
  totalCount,
  currentPage,
  totalPages,
  departments,
}: UsersClientWrapperProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [statusUser, setStatusUser] = useState<UserItem | null>(null);
  const [roleUser, setRoleUser] = useState<UserItem | null>(null);

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <UserFilters
        departments={departments}
        totalResults={totalCount}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Users Table */}
      <UserTable
        users={users}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onEditUser={(user) => setEditingUser(user)}
        onToggleStatus={(user) => setStatusUser(user)}
        onChangeRole={(user) => setRoleUser(user)}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        departments={departments}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        departments={departments}
      />

      {/* Status Toggle Modal */}
      <UserStatusModal
        user={statusUser}
        isOpen={!!statusUser}
        onClose={() => setStatusUser(null)}
      />

      {/* Role Change Modal */}
      <UserRoleModal
        user={roleUser}
        isOpen={!!roleUser}
        onClose={() => setRoleUser(null)}
      />
    </div>
  );
}
