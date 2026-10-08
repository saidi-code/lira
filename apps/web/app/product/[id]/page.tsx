"use client";

import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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

  const add = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      const token = await getToken();
      return cartApi.add(
        { productId: id, quantity: 1, size, color },
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

  const image = product.images?.[0] ?? product.colors?.[0]?.images?.[0];
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl bg-surface-dim">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-square items-center justify-center font-serif text-4xl text-primary/40">
            ليرة
          </div>
        )}
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl">{product.name}</h1>
          {product.subtitle ? (
            <p className="mt-1 text-muted">{product.subtitle}</p>
          ) : null}
          <p className="mt-4 text-2xl font-bold text-primary">
            {formatPrice(product.price, "TND")}
          </p>
        </div>
        {product.description ? (
          <p className="leading-relaxed text-ink/80">{product.description}</p>
        ) : null}

        {sizes.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">المقاس</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    size === s
                      ? "border-primary bg-surface-dim text-primary-dim"
                      : "border-primary/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {colors.length > 0 ? (
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted">اللون</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                    color === c.hex
                      ? "border-primary bg-surface-dim"
                      : "border-primary/20"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-primary/20"
                    style={{ background: c.hex }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {typeof product.stock === "number" && product.stock <= 2 && product.stock > 0 ? (
          <p className="italic text-danger">تبقّى {product.stock} فقط</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => add.mutate()}
            disabled={add.isLoading}
            className="flex-1 rounded-xl bg-primary py-4 font-medium text-white shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            {add.isLoading ? "..." : "أضف إلى الحقيبة"}
          </button>
          <button
            onClick={() => wish.mutate()}
            className="rounded-xl border border-primary/40 bg-white/60 px-6 py-4 font-medium text-primary"
          >
            المفضلة
          </button>
        </div>
        {message ? <p className="text-sm text-primary-dim">{message}</p> : null}
      </div>
    </div>
  );
}
