import Link from "next/link";
import type { Product } from "@lira/shared";
import { formatPrice } from "@lira/shared";
import { ProductCardActions } from "./ProductCardActions";

export function ProductCard({ product }: { product: Product }) {
  const image =
    product.featureImage ||
    product.colors?.[0]?.featureImage ||
    product.colors?.[0]?.images?.[0] ||
    product.images?.[0];
  const stock = product.stock ?? 0;

  return (
    <Link href={`/product/${product._id}`} className="product-card group">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-dim">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_40%,#f7f1e9,#e9dccb)] font-serif text-4xl text-primary/50">
            ليرة
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] tracking-wide text-primary-dim backdrop-blur-sm">
          {product.isFeatured ? "اختيار ليرة" : "من ليرة"}
        </span>
        {stock <= 0 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-[#3c3633]/85 px-3 py-1.5 text-[10px] text-white backdrop-blur-sm">
            نفدت الكمية
          </span>
        ) : null}
        <ProductCardActions productId={product._id} name={product.name} disabled={stock <= 0} />
      </div>
      <div className="space-y-1.5 px-4 pb-4 pt-4">
        {product.brand ? <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{product.brand}</p> : null}
        <h3 className="line-clamp-1 font-serif text-base text-ink transition group-hover:text-primary-dim sm:text-lg">
          {product.name}
        </h3>
        {product.subtitle ? <p className="line-clamp-1 text-xs text-muted sm:text-sm">{product.subtitle}</p> : null}
        <p className="pt-1 text-base font-semibold text-primary-dim sm:text-lg">
          {formatPrice(product.price, "TND")}
        </p>
      </div>
    </Link>
  );
}
