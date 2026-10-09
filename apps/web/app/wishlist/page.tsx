"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi, wishlistApi } from "@/lib/shop";

export default function WishlistPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => wishlistApi.get(await getToken()),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => wishlistApi.remove(id, await getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  const addToCart = useMutation({
    mutationFn: async (id: string) => cartApi.add({ productId: id, quantity: 1 }, await getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = data?.items ?? [];
  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-dim" />;

  return (
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/">الرئيسية</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">المفضلة</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">اختياراتكم</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">المفضلة</h1>
        {items.length > 0 ? (
          <p className="mt-2 text-sm text-muted">{items.length} قطعة محفوظة</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-primary/15 bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl">قائمة المفضلة فارغة</p>
          <p className="mt-2 text-sm text-muted">اضغطوا على القلب في أي قطعة لتحفظوها هنا.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-dim">
            اكتشفوا التشكيلة
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {items.map((item) => {
            const p = item.product;
            if (!p) return null;
            const image = p.featureImage ?? p.images?.[0];
            return (
              <article key={p._id} className="product-card group">
                <Link href={`/product/${p._id}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-dim">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#f7f1e9,#e9dccb)] font-serif text-3xl text-primary/50">
                        ليرة
                      </div>
                    )}
                    <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] tracking-wide text-primary-dim backdrop-blur-sm">
                      من ليرة
                    </span>
                  </div>
                </Link>
                <div className="space-y-1.5 px-4 pb-4 pt-4">
                  <h2 className="line-clamp-1 font-serif text-base text-ink transition group-hover:text-primary-dim sm:text-lg">
                    <Link href={`/product/${p._id}`}>{p.name}</Link>
                  </h2>
                  {p.subtitle ? <p className="line-clamp-1 text-xs text-muted sm:text-sm">{p.subtitle}</p> : null}
                  <p className="pt-1 text-base font-semibold text-primary-dim sm:text-lg">
                    {formatPrice(p.price, "TND")}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => addToCart.mutate(p._id)}
                      disabled={addToCart.isLoading}
                      className="flex-1 rounded-full bg-primary py-2 text-xs font-medium text-white transition hover:bg-primary-dim disabled:opacity-50"
                    >
                      أضف إلى الحقيبة
                    </button>
                    <button
                      onClick={() => remove.mutate(p._id)}
                      aria-label={`إزالة ${p.name} من المفضلة`}
                      className="rounded-full border border-primary/30 px-3 py-2 text-xs text-danger transition hover:bg-surface-dim"
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
