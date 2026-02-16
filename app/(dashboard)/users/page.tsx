"use client";

import { useUsers } from "@/hooks/use-users";

export default function UsersPage() {
  const users = useUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
      <p className="mt-2 text-zinc-600">Manage users here.</p>

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
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Updated
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
