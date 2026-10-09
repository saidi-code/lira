"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "@/lib/shop";

export default function CartPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => cartApi.get(await getToken()),
  });

  const remove = useMutation({
    mutationFn: async (item: { productId: string; size?: string | null; color?: string | null }) =>
      cartApi.remove(item.productId, { size: item.size, color: item.color }, await getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = cart?.items ?? [];

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-dim" />;

  return (
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/">الرئيسية</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">حقيبة التسوق</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">حقيبتكم</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">حقيبة التسوق</h1>
        {items.length > 0 ? (
          <p className="mt-2 text-sm text-muted">{items.length} قطعة في الحقيبة</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-primary/15 bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">حقيبتكم فارغة</p>
          <p className="mt-2 text-sm text-muted">اكتشفوا تشكيلة ليرة واختاروا ما يليق بكم.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-dim">
            تسوّق الآن
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li
                key={`${item.product?._id}-${item.size}-${item.color}-${i}`}
                className="flex gap-4 rounded-3xl border border-primary/10 bg-white p-4 shadow-card"
              >
                <Link
                  href={`/product/${item.product?._id}`}
                  className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-dim"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product?.featureImage ?? item.product?.images?.[0]}
                    alt={item.product?.name ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <Link href={`/product/${item.product?._id}`} className="font-serif text-lg transition hover:text-primary-dim">
                      {item.product?.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      الكمية {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                      {item.color ? ` · ${item.color}` : ""}
                      {item.sku ? ` · SKU ${item.sku}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary-dim">
                      {formatPrice(item.price * item.quantity, "TND")}
                    </p>
                    <button
                      aria-label={`إزالة ${item.product?.name ?? ""} من الحقيبة`}
                      className="text-sm text-danger transition hover:underline"
                      onClick={() =>
                        remove.mutate({
                          productId: item.product._id,
                          size: item.size,
                          color: item.color,
                        })
                      }
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="space-y-4 lg:sticky lg:top-44 lg:self-start">
            <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-card">
              <h2 className="font-serif text-xl">ملخص الحقيبة</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">المجموع الفرعي</dt>
                  <dd className="font-medium">{formatPrice(cart?.totalAmount ?? 0, "TND")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">الشحن</dt>
                  <dd className="font-medium">يُحسب في الخادم</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-5">
                <span className="text-muted">المجموع</span>
                <span className="text-2xl font-bold text-primary-dim">
                  {formatPrice(cart?.totalAmount ?? 0, "TND")}
                </span>
              </div>
              <Link
                href="/checkout"
                className="mt-6 block rounded-full bg-primary py-4 text-center font-medium text-white transition hover:bg-primary-dim"
              >
                إتمام الطلب
              </Link>
              <Link
                href="/shop"
                className="mt-3 block rounded-full border border-primary/30 py-3 text-center text-sm text-primary-dim transition hover:bg-surface-dim"
              >
                مواصلة التسوّق
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
