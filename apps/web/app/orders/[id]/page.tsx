"use client";

import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { orderApi } from "@/lib/shop";

const STEPS = [
  { key: "placed", label: "تم استلام الطلب" },
  { key: "processing", label: "قيد التجهيز" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التوصيل" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => orderApi.one(id, await getToken()),
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-dim" />;
  if (!order) return <p>الطلب غير موجود.</p>;

  const idx = STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">تفاصيل الطلب</p>
        <h1 className="font-serif text-3xl">{order.orderNumber}</h1>
      </header>
      <ol className="flex justify-between gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex-1 text-center text-xs">
            <div
              className={`mx-auto mb-2 h-8 w-8 rounded-full ${
                i <= idx ? "bg-primary text-white" : "bg-surface-dim text-muted"
              } flex items-center justify-center`}
            >
              {i <= idx ? "✓" : i + 1}
            </div>
            {s.label}
          </li>
        ))}
      </ol>
      <ul className="space-y-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between rounded-xl bg-white p-4 shadow-card">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-primary">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xl font-bold text-primary">{formatPrice(order.totalAmount)}</p>
    </div>
  );
}
