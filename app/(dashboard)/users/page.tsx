"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { UserModal } from "@/components/users/user-modal";
import { deleteUser } from "@/lib/users";

export default function UsersPage() {
  const users = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  function openAdd() {
    setEditingUser(null);
    setModalMode("add");
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setModalMode("edit");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
          <p className="mt-2 text-zinc-600">Manage users here.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Add user
        </button>
      </div>

      <div className="mt-6">
        {users.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-zinc-500">
            No users yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    PIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Server
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-zinc-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-600">
                      {user.pin}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.server ? (
                        <span className="text-blue-600" aria-label="Server">
                          <svg
                            className="inline h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {user.createdAt instanceof Date
                        ? user.createdAt.toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {user.updatedAt instanceof Date
                        ? user.updatedAt.toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal
        isOpen={modalOpen}
        mode={modalMode}
        user={editingUser}
        onClose={closeModal}
        onSuccess={() => {}}
      />
    </div>
  );
}
