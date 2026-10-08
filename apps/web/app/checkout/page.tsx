"use client";

import { useAuth } from "@clerk/nextjs";
import { FALLBACK_PRICING, formatPrice } from "@lira/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
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
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="font-serif text-3xl">إتمام الطلب</h1>
      <p className="text-sm text-muted">
        الشحن والضريبة يُحسبان في الخادم. الأرقام أدناه للعرض فقط.
      </p>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">عنوان الشحن</h2>
        {addresses.length === 0 ? (
          <p className="text-muted">لا توجد عناوين. أضف عنواناً من التطبيق أولاً.</p>
        ) : (
          addresses.map((a) => (
            <button
              key={a._id}
              onClick={() => setAddressId(a._id)}
              className={`w-full rounded-2xl border p-4 text-right ${
                selected?._id === a._id
                  ? "border-primary bg-surface-dim"
                  : "border-primary/15 bg-white"
              }`}
            >
              <p className="font-medium">{a.type}</p>
              <p className="text-sm text-muted">
                {a.street}، {a.city}
              </p>
            </button>
          ))
        )}
      </section>

      <div className="space-y-2 rounded-2xl bg-white p-5 shadow-card">
        <Row label="المجموع الفرعي" value={formatPrice(subtotal)} />
        <Row label="الشحن" value={formatPrice(shipping)} />
        <Row label="الضريبة" value={formatPrice(tax)} />
        <Row label="الإجمالي" value={formatPrice(total)} strong />
      </div>

      {error ? <p className="italic text-danger">{error}</p> : null}

      <button
        disabled={place.isLoading || !selected || !items.length}
        onClick={() => place.mutate()}
        className="w-full rounded-xl bg-primary py-4 font-medium text-white disabled:opacity-50"
      >
        {place.isLoading ? "جاري التأكيد..." : "تأكيد الطلب — الدفع عند الاستلام"}
      </button>
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
