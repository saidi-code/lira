import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";

interface TransferItem {
  product: { _id: string; name: string };
  quantity: number;
}

interface Transfer {
  _id: string;
  fromWarehouse: { _id: string; name: string };
  toWarehouse: { _id: string; name: string };
  status: string;
  items: TransferItem[];
  createdAt?: string;
}

export function TransfersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "transfers"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.transfers(token);
      return asList<Transfer>(res.data ?? res);
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      return adminApi.setTransferStatus(id, status, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transfers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading transfers…</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load transfers.
      </div>
    );
  }

  const transfers = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Transfers</h1>
          <p className="text-sm text-muted">Inter-warehouse stock movements and tracking</p>
        </div>
        <span className="rounded-xl bg-surface-dim px-3 py-1.5 text-xs font-semibold text-primary-dim">
          {transfers.length} Transfers
        </span>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Transfer ID</th>
                <th className="pb-3">From</th>
                <th className="pb-3">To</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {transfers.map((t) => (
                <tr key={t._id} className="hover:bg-canvas/50">
                  <td className="py-3 font-medium text-primary-dim">
                    TRF-{t._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-3 text-ink">{t.fromWarehouse?.name || "—"}</td>
                  <td className="py-3 text-ink">{t.toWarehouse?.name || "—"}</td>
                  <td className="py-3 text-xs text-muted">
                    {t.items.map((i) => (
                      <div key={i.product?._id}>
                        {i.product?.name}: {i.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="py-3">
                    <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-medium text-primary-dim">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {t.status === "draft" && (
                      <button
                        onClick={() =>
                          setStatusMutation.mutate({ id: t._id, status: "in_transit" })
                        }
                        className="rounded-lg border border-primary/30 bg-surface-dim px-2.5 py-1 text-xs font-medium text-primary-dim hover:bg-primary hover:text-white transition-colors"
                      >
                        Dispatch
                      </button>
                    )}
                    {t.status === "in_transit" && (
                      <button
                        onClick={() =>
                          setStatusMutation.mutate({ id: t._id, status: "completed" })
                        }
                        className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-primary-dim transition-colors"
                      >
                        Complete Transfer
                      </button>
                    )}
                    {t.status === "completed" && (
                      <span className="text-xs text-muted">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No transfers found.
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
