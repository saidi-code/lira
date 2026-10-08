"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/lib/shop";

const STATUS: Record<string, string> = {
  placed: "تم استلام الطلب",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

export default function OrdersPage() {
  const { getToken } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => orderApi.mine(await getToken()),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-dim" />;

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">طلباتي</h1>
      {orders.length === 0 ? (
        <p className="text-muted">لا توجد طلبات بعد.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o._id}>
              <Link
                href={`/orders/${o._id}`}
                className="block rounded-2xl border border-primary/10 bg-white p-5 shadow-card"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="rounded-full border border-primary/20 bg-surface-dim px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-dim">
                    {STATUS[o.orderStatus] ?? o.orderStatus}
                  </span>
                </div>
                <p className="mt-2 text-primary">{formatPrice(o.totalAmount)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
