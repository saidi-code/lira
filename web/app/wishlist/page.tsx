"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { formatPrice } from "@lira/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/lib/shop";

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

  const items = data?.items ?? [];
  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-surface-dim" />;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">المفضلة</h1>
      {items.length === 0 ? (
        <p className="text-muted">قائمة المفضلة فارغة.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <div
                key={p._id}
                className="rounded-2xl border border-primary/10 bg-white p-4 shadow-card"
              >
                <Link href={`/product/${p._id}`} className="font-serif text-lg">
                  {p.name}
                </Link>
                <p className="text-primary">{formatPrice(p.price)}</p>
                <button
                  className="mt-2 text-sm text-danger"
                  onClick={() => remove.mutate(p._id)}
                >
                  إزالة
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
