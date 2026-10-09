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
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/">الرئيسية</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">طلباتي</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">حسابكم</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">طلباتي</h1>
        {orders.length > 0 ? (
          <p className="mt-2 text-sm text-muted">{orders.length} طلب</p>
        ) : null}
      </header>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-primary/15 bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">لا توجد طلبات بعد</p>
          <p className="mt-2 text-sm text-muted">عندما تطلبوا من ليرة ستجدون كل تفاصيل الطلب هنا.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-dim">
            ابدأوا التسوّق
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o._id}>
              <Link
                href={`/orders/${o._id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/10 bg-white p-6 shadow-card transition hover:border-primary/30"
              >
                <div>
                  <span className="font-serif text-lg">{o.orderNumber}</span>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString("ar", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="rounded-full border border-primary/20 bg-surface-dim px-3 py-1 text-xs font-bold text-primary-dim">
                    {STATUS[o.orderStatus] ?? o.orderStatus}
                  </span>
                  <span className="font-bold text-primary-dim">{formatPrice(o.totalAmount, "TND")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
