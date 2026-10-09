"use client";

import { useAuth } from "@clerk/nextjs";
import { FALLBACK_PRICING, formatPrice } from "@lira/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { catalogApi } from "@/lib/catalog";
import { addressApi, cartApi, newIdempotencyKey, orderApi } from "@/lib/shop";

export default function CheckoutPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const key = useRef(newIdempotencyKey());
  const [addressId, setAddressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => cartApi.get(await getToken()),
  });
  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => addressApi.list(await getToken()),
  });
  const { data: pricing = FALLBACK_PRICING } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => catalogApi.pricing(),
  });

  const selected =
    addresses.find((a) => a._id === addressId) ??
    addresses.find((a) => a.isDefault) ??
    addresses[0];

  const subtotal = cart?.totalAmount ?? 0;
  const free =
    pricing.freeShippingThreshold != null &&
    subtotal >= pricing.freeShippingThreshold;
  const shipping = free ? 0 : pricing.shippingCost;
  const tax = +(subtotal * pricing.taxRate).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const items = useMemo(() => cart?.items ?? [], [cart]);

  const place = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("يرجى اختيار عنوان الشحن");
      if (!items.length) throw new Error("الحقيبة فارغة");
      const token = await getToken();
      return orderApi.create(
        {
          items: items.map((i) => ({
            product: i.product._id,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            sku: i.sku,
          })),
          shippingAddressId: selected._id,
          paymentMethod: "cash",
        },
        token,
        key.current
      );
    },
    onSuccess: (order) => {
      key.current = newIdempotencyKey();
      router.push(`/checkout/success?order=${order?._id ?? ""}`);
    },
    onError: (e: Error) => setError(e.message || "تعذر إتمام الطلب"),
  });

  return (
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/cart">حقيبة التسوق</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">إتمام الطلب</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">الخطوة الأخيرة</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">إتمام الطلب</h1>
        <p className="mt-2 text-sm text-muted">
          الشحن والضريبة يُحسبان في الخادم. الأرقام أدناه للعرض فقط.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-serif text-xl">عنوان الشحن</h2>
            {addresses.length === 0 ? (
              <p className="rounded-2xl border border-primary/15 bg-white p-5 text-sm text-muted">
                لا توجد عناوين. أضف عنواناً من التطبيق أولاً.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <li key={a._id}>
                    <button
                      onClick={() => setAddressId(a._id)}
                      aria-pressed={selected?._id === a._id}
                      className={`w-full rounded-2xl border p-4 text-right transition ${
                        selected?._id === a._id
                          ? "border-primary bg-surface-dim"
                          : "border-primary/15 bg-white hover:border-primary/40"
                      }`}
                    >
                      <p className="font-medium">{a.type}</p>
                      <p className="text-sm text-muted">
                        {a.street}، {a.city}
                      </p>
                      <p className="mt-1 text-xs text-muted">{a.phoneNumber}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl">طريقة الدفع</h2>
            <p className="rounded-2xl border border-primary/15 bg-surface-dim p-5 text-sm text-primary-dim">
              الدفع عند الاستلام — تدفعون عند وصول الطلب.
            </p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-44 lg:self-start">
          <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-card">
            <h2 className="font-serif text-xl">ملخص الطلب</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="المجموع الفرعي" value={formatPrice(subtotal)} />
              <Row label="الشحن" value={formatPrice(shipping)} />
              <Row label="الضريبة" value={formatPrice(tax)} />
            </dl>
            <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-5">
              <span className="text-muted">الإجمالي</span>
              <span className="text-2xl font-bold text-primary-dim">{formatPrice(total, "TND")}</span>
            </div>

            {error ? <p className="mt-4 italic text-danger">{error}</p> : null}

            <button
              disabled={place.isLoading || !selected || !items.length}
              onClick={() => place.mutate()}
              className="mt-6 w-full rounded-full bg-primary py-4 font-medium text-white transition hover:bg-primary-dim disabled:opacity-50"
            >
              {place.isLoading ? "جاري التأكيد..." : "تأكيد الطلب — الدفع عند الاستلام"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "text-lg font-bold text-primary" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
