import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { formatPrice } from "@lira/shared";

interface AdminStats {
  totalUsers?: number;
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  recentOrders?: Array<{
    _id: string;
    orderNumber?: string;
    totalAmount?: number;
    orderStatus?: string;
    createdAt?: string;
    user?: { name?: string; email?: string };
  }>;
}

export function DashboardPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.stats(token);
      return (res.data ?? res) as AdminStats;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return <div className="text-muted">Loading dashboard metrics…</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load dashboard metrics.
      </div>
    );
  }

  const stats = data ?? {};

  const cards = [
    { label: "Total Revenue", value: formatPrice(stats.totalRevenue ?? 0, "TND") },
    { label: "Total Orders", value: stats.totalOrders ?? 0 },
    { label: "Products in Catalog", value: stats.totalProducts ?? 0 },
    { label: "Registered Users", value: stats.totalUsers ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Atelier operations, performance & live metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <h2 className="font-serif text-xl font-medium text-ink">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {stats.recentOrders?.map((ord) => (
                <tr key={ord._id} className="hover:bg-canvas/50">
                  <td className="py-3 font-medium text-primary-dim">
                    {ord.orderNumber || ord._id.slice(-6)}
                  </td>
                  <td className="py-3 text-ink">
                    {ord.user?.name || ord.user?.email || "Guest"}
                  </td>
                  <td className="py-3 font-semibold text-primary">
                    {formatPrice(ord.totalAmount ?? 0, "TND")}
                  </td>
                  <td className="py-3">
                    <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-medium text-primary-dim">
                      {ord.orderStatus || "placed"}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No recent orders.
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
