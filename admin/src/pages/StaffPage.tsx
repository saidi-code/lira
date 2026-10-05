import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";
import { USER_ROLES, type UserRole } from "@lira/shared";

interface AdminUser {
  _id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt?: string;
}

export function StaffPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.users(token);
      return asList<AdminUser>(res.data ?? res);
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const token = await getToken();
      return adminApi.setRole(id, role, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading staff accounts…</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load staff accounts.
      </div>
    );
  }

  const users = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Staff & Roles</h1>
          <p className="text-sm text-muted">Role-based access control and atelier permissions</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-surface-dim p-4 text-xs text-primary-dim">
        <p className="font-semibold">Note on Clerk synchronization:</p>
        <p className="mt-1">
          Roles set here are updated in the local database. On next customer sign-in, Clerk webhook syncs metadata. Ensure metadata matches for permanence.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">User</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Current Role</th>
                <th className="pb-3">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-canvas/50">
                  <td className="py-3 font-medium text-ink">{u.name || "Customer"}</td>
                  <td className="py-3 text-xs text-muted">{u.email || u.phoneNumber || "—"}</td>
                  <td className="py-3">
                    <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-semibold text-primary-dim">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      disabled={setRoleMutation.isLoading}
                      onChange={(e) =>
                        setRoleMutation.mutate({ id: u._id, role: e.target.value })
                      }
                      className="rounded-lg border border-primary/20 bg-white px-2.5 py-1 text-xs text-ink focus:border-primary focus:outline-none"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r} {r === "cashier" ? "(no access today)" : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
