import Link from "next/link";
import type { Product } from "@lira/shared";
import { formatPrice } from "@lira/shared";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? product.colors?.[0]?.images?.[0];
  return (
    <Link
      href={`/product/${product._id}`}
      className="group overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="aspect-[4/5] overflow-hidden bg-surface-dim">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-primary/40">
            ليرة
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-serif text-lg text-ink">{product.name}</h3>
        {product.subtitle ? (
          <p className="text-sm text-muted">{product.subtitle}</p>
        ) : null}
        <p className="text-lg font-bold text-primary">
          {formatPrice(product.price, "TND")}
        </p>
      </div>
    </Link>
  );
}
