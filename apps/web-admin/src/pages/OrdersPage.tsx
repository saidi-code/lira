import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";
import { formatPrice } from "@lira/shared";

interface AdminOrder {
  _id: string;
  orderNumber?: string;
  user?: { name?: string; email?: string; phoneNumber?: string };
  totalAmount?: number;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: Array<{ quantity: number; price: number; product?: { name?: string } }>;
  createdAt?: string;
}

export function OrdersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.orders(token);
      return asList<AdminOrder>(res.data ?? res);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken();
      return adminApi.setOrderStatus(id, status, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  if (isLoading) return <div className="text-muted">Loading orders…</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load orders.
      </div>
    );
  }

  const orders = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Orders</h1>
          <p className="text-sm text-muted">Customer acquisitions, fulfillment & statuses</p>
        </div>
        <span className="rounded-xl bg-surface-dim px-3 py-1.5 text-xs font-semibold text-primary-dim">
          {orders.length} Orders
        </span>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Fulfillment Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {orders.map((ord) => (
                <tr key={ord._id} className="hover:bg-canvas/50">
                  <td className="py-3 font-medium text-primary-dim">
                    {ord.orderNumber || ord._id.slice(-6)}
                  </td>
                  <td className="py-3 text-ink">
                    <div>{ord.user?.name || "Customer"}</div>
                    <div className="text-xs text-muted">{ord.user?.email || ord.user?.phoneNumber || "—"}</div>
                  </td>
                  <td className="py-3 text-muted">
                    {ord.items?.length ?? 0} item(s)
                  </td>
                  <td className="py-3 font-semibold text-primary">
                    {formatPrice(ord.totalAmount ?? 0, "TND")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ord.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ord.paymentStatus || "pending"}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-medium text-primary-dim">
                      {ord.orderStatus || "placed"}
                    </span>
                  </td>
                  <td className="py-3">
                    <select
                      value={ord.orderStatus || "placed"}
                      disabled={updateStatus.isLoading}
                      onChange={(e) =>
                        updateStatus.mutate({ id: ord._id, status: e.target.value })
                      }
                      className="rounded-lg border border-primary/20 bg-white px-2 py-1 text-xs text-ink focus:border-primary focus:outline-none"
                    >
                      <option value="placed">placed</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No orders recorded yet.
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
