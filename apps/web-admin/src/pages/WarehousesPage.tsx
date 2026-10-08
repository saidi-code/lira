import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";

interface Warehouse {
  _id: string;
  name: string;
  code?: string;
  isDefault?: boolean;
  isActive?: boolean;
  address?: { street?: string; city?: string; country?: string };
}

export function WarehousesPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.warehouses(token);
      return asList<Warehouse>(res.data ?? res);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return adminApi.setDefaultWarehouse(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "warehouses"] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading warehouses…</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load warehouses.
      </div>
    );
  }

  const warehouses = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Warehouses</h1>
          <p className="text-sm text-muted">Atelier storage facilities & distribution nodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((w) => (
          <div
            key={w._id}
            className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-medium text-ink">{w.name}</h3>
                  <p className="font-mono text-xs text-muted">{w.code || "WH-LOC"}</p>
                </div>
                {w.isDefault && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-4 text-xs text-muted">
                <p>{w.address?.street || "No street address"}</p>
                <p>{w.address?.city ? `${w.address.city}, ` : ""}{w.address?.country || ""}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-primary/10">
              {!w.isDefault && (
                <button
                  disabled={setDefaultMutation.isLoading}
                  onClick={() => setDefaultMutation.mutate(w._id)}
                  className="w-full rounded-xl border border-primary/30 bg-surface-dim py-2 text-xs font-medium text-primary-dim hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted">
            No warehouses configured. Seed with <code className="font-mono">npm run seed:warehouses</code>.
          </div>
        )}
      </div>
    </div>
  );
}
