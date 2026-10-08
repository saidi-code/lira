import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { catalogApi } from "@/lib/catalog";
import type { Product } from "@lira/shared";

export const revalidate = 120;

export default async function HomePage() {
  const [{ products }, collections] = await Promise.all([
    catalogApi.products({ limit: 8, page: 1 }),
    catalogApi.collections().catch(() => []),
  ]);
  const featured = collections.filter((c) => c.isFeatured).slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="rounded-[32px] bg-surface-dim px-8 py-16 text-center shadow-card">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Atelier</p>
        <h1 className="mt-4 font-serif text-4xl text-primary-dim md:text-5xl">ليرة</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          بوتيك حِرَفي يمزج الخط العربي الملكي بالفخامة الهادئة — عطور، حرير، وجلود نادرة.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex rounded-xl bg-primary px-8 py-4 font-medium text-white shadow-md shadow-primary/20"
        >
          استكشف الكتالوج
        </Link>
      </section>

      {featured.length > 0 ? (
        <section className="space-y-6">
          <h2 className="font-serif text-2xl">مجموعات مختارة</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((col) => (
              <Link
                key={col._id}
                href="/shop"
                className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card"
              >
                {col.banner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={col.banner}
                    alt={col.title}
                    className="h-48 w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <h3 className="font-serif text-xl">{col.title}</h3>
                  <p className="mt-1 text-sm text-muted">{col.subtitle}</p>
                  <span className="mt-3 inline-block text-sm text-primary">{col.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl">قطع جديدة</h2>
          <Link href="/shop" className="text-sm text-primary">
            عرض الكل
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
