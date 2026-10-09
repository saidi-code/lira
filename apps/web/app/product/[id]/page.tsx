"use client";

import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { catalogApi } from "@/lib/catalog";
import { cartApi, wishlistApi } from "@/lib/shop";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => catalogApi.product(id),
  });

  const colors = product?.colors ?? [];
  const selectedColor = colors.find((c) => c.name === color || c.hex === color) ?? colors[0];
  const variants = selectedColor?.variants ?? [];
  const selectedVariant = variants.find((v) => v.size === size) ?? variants.find((v) => v.isActive !== false && v.stock > 0);
  const isVariable = product?.type === "variable";
  const image = product?.featureImage ?? selectedColor?.featureImage ?? selectedColor?.images?.[0] ?? product?.images?.[0];
  const available = isVariable ? Number(selectedVariant?.stock ?? 0) : Number(product?.stock ?? 0);
  const gallery = useMemo(
    () =>
      Array.from(
        new Set(
          [
            image,
            selectedColor?.featureImage,
            ...(selectedColor?.images ?? []),
            product?.featureImage,
            ...(product?.images ?? []),
          ].filter((src): src is string => Boolean(src))
        )
      ),
    [image, product, selectedColor]
  );

  const add = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      const token = await getToken();
      return cartApi.add(
        { productId: id, quantity: 1, size: isVariable ? selectedVariant?.size ?? null : null, color: isVariable ? selectedColor?.name ?? null : null },
        token
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      setMessage("أُضيفت إلى الحقيبة");
    },
    onError: () => setMessage("تعذر الإضافة — تحقق من المخزون أو سجّل الدخول"),
  });

  const wish = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      const token = await getToken();
      return wishlistApi.add(id, token);
    },
    onSuccess: () => setMessage("أُضيفت إلى المفضلة"),
  });

  if (isLoading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-surface-dim" />;
  }
  if (!product) {
    return <p className="text-muted">القطعة غير موجودة.</p>;
  }

  return (
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/">الرئيسية</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <Link href="/shop">تسوّقوا</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-[24px] border border-primary/10 bg-surface-dim">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#f7f1e9,#e9dccb)] font-serif text-5xl text-primary/40">
                ليرة
              </div>
            )}
          </div>
          {gallery.length > 1 ? (
            <ul className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((thumb, index) => (
                <li key={`${thumb}-${index}`} className="overflow-hidden rounded-xl border border-primary/10 bg-surface-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-40 lg:self-start">
          <div>
            {product.brand ? (
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{product.brand}</p>
            ) : null}
            <h1 className="mt-2 font-serif text-3xl leading-snug md:text-4xl">{product.name}</h1>
            {product.subtitle ? <p className="mt-2 text-muted">{product.subtitle}</p> : null}
            <p className="mt-5 text-3xl font-bold text-primary-dim">
              {formatPrice(product.price, "TND")}
            </p>
          </div>

          {product.description ? (
            <p className="border-y border-primary/10 py-5 text-sm leading-8 text-ink/80">
              {product.description}
            </p>
          ) : null}

          {isVariable && colors.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">اللون</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button key={c.name} type="button" onClick={() => { setColor(c.name); setSize(null); }}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${selectedColor?.name === c.name ? "border-primary bg-surface-dim text-primary-dim" : "border-primary/20 hover:border-primary/40"}`}>
                    <span className="h-4 w-4 rounded-full border border-primary/20" style={{ background: c.hex }} />{c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isVariable && variants.length > 0 ? (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">المقاس</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button key={v.sku} type="button" disabled={v.isActive === false || v.stock <= 0}
                    onClick={() => setSize(v.size)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedVariant?.sku === v.sku
                        ? "border-primary bg-surface-dim text-primary-dim"
                        : "border-primary/20 hover:border-primary/40"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {available > 0 && available <= 2 ? (
            <p className="italic text-danger">تبقّى {available} فقط</p>
          ) : null}
          {available <= 0 ? <p className="italic text-danger">نفدت الكمية</p> : null}
          {isVariable && selectedVariant ? <p className="text-xs text-muted">SKU: {selectedVariant.sku}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => add.mutate()}
              disabled={add.isLoading || (isVariable && (!selectedVariant || selectedVariant.isActive === false || selectedVariant.stock <= 0)) || (!isVariable && available <= 0)}
              className="flex-1 rounded-full bg-primary py-4 font-medium text-white shadow-md shadow-primary/20 transition hover:bg-primary-dim active:scale-[0.98] disabled:opacity-50"
            >
              {add.isLoading ? "..." : "أضف إلى الحقيبة"}
            </button>
            <button
              onClick={() => wish.mutate()}
              aria-label="أضف إلى المفضلة"
              className="flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-white/60 px-6 py-4 font-medium text-primary transition hover:bg-surface-dim"
            >
              <HeartIcon />
              المفضلة
            </button>
          </div>
          {message ? <p className="text-sm text-primary-dim">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
