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
      <h1 className="font-serif text-3xl">حقيبة التسوق</h1>
      {items.length === 0 ? (
        <p className="text-muted">
          الحقيبة فارغة.{" "}
          <Link href="/shop" className="text-primary">
            تسوّق الآن
          </Link>
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li
                key={`${item.product?._id}-${item.size}-${item.color}-${i}`}
                className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-4 shadow-card"
              >
                <div>
                  <p className="font-serif text-lg">{item.product?.name}</p>
                  <p className="text-sm text-muted">
                    الكمية {item.quantity}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                    {item.sku ? ` · SKU ${item.sku}` : ""}
                  </p>
                  <p className="mt-1 font-bold text-primary">
                    {formatPrice(item.price * item.quantity, "TND")}
                  </p>
                </div>
                <button
                  className="text-sm text-danger"
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
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-2xl bg-surface-dim p-6">
            <span className="text-muted">المجموع</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(cart?.totalAmount ?? 0, "TND")}
            </span>
          </div>
          <Link
            href="/checkout"
            className="block rounded-xl bg-primary py-4 text-center font-medium text-white"
          >
            إتمام الطلب
          </Link>
        </>
      )}
    </div>
  );
}
