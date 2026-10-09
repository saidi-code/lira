"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, wishlistApi } from "@/lib/shop";

export function ProductCardActions({
  productId,
  name,
  disabled,
}: {
  productId: string;
  name: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      return cartApi.add({ productId, quantity: 1 }, await getToken());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const favori = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }
      return wishlistApi.add(productId, await getToken());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  return (
    <div
      className="card-actions"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        aria-label={`أضف ${name} إلى الحقيبة`}
        disabled={disabled || add.isLoading}
        onClick={() => add.mutate()}
        className="card-action card-action-primary"
      >
        <span aria-hidden="true">أضف إلى الحقيبة</span>
      </button>
      <button
        type="button"
        aria-label={`أضف ${name} إلى المفضلة`}
        disabled={disabled || favori.isLoading}
        onClick={() => favori.mutate()}
        className="card-action"
      >
        <HeartIcon />
      </button>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}