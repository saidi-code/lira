import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { catalogApi } from "@/lib/catalog";

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? 1);
  const [{ products, pagination }, categories] = await Promise.all([
    catalogApi.products({
      page,
      limit: 12,
      category: searchParams.category,
      search: searchParams.q,
    }),
    catalogApi.categories().catch(() => []),
  ]);

  const activeCategory = searchParams.category ?? "";
  const totalPages = pagination?.totalPages ?? pagination?.pages ?? 1;
  const pageHref = (next: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.category) params.set("category", searchParams.category);
    params.set("page", String(next));
    return `/shop?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      <nav aria-label="مسار التصفح" className="crumb">
        <Link href="/">الرئيسية</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="text-primary-dim">{activeCategory || "كل الأقسام"}</span>
      </nav>

      <header className="page-head">
        <p className="eyebrow">تسوّقوا</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">{activeCategory || "الكتالوج"}</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
          قطع مختارة بعناية من عالم ليرة — عطور، حرير، جلود، وخزف.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-6">
          <form className="space-y-3" action="/shop">
            <label htmlFor="shop-q" className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              ابحثوا
            </label>
            <input
              id="shop-q"
              name="q"
              defaultValue={searchParams.q}
              placeholder="ابحثوا عن قطعة..."
              className="w-full rounded-full border border-primary/20 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
            <button className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dim">
              تصفية
            </button>
          </form>

          <nav aria-label="الأقسام" className="space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">الأقسام</p>
            <Link
              href="/shop"
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                !activeCategory ? "bg-surface-dim font-medium text-primary-dim" : "text-ink/80 hover:bg-surface-dim"
              }`}
            >
              كل الأقسام
            </Link>
            {categories.map((c) => {
              const isActive = c.title === activeCategory;
              return (
                <Link
                  key={c._id}
                  href={`/shop?category=${encodeURIComponent(c.title)}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? "bg-surface-dim font-medium text-primary-dim" : "text-ink/80 hover:bg-surface-dim"
                  }`}
                >
                  {c.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-primary/15 bg-white px-6 py-14 text-center">
              <p className="font-serif text-2xl">لا توجد قطع مطابقة</p>
              <p className="mt-2 text-sm text-muted">جرّبوا قسماً آخر أو ابحثوا بكلمة مختلفة.</p>
              <Link href="/shop" className="mt-6 inline-flex rounded-full border border-primary/40 px-5 py-2.5 text-sm text-primary-dim transition hover:bg-surface-dim">
                عرض كل الأقسام
              </Link>
            </div>
          )}

          {totalPages > 1 ? (
            <nav aria-label="تصفح الصفحات" className="flex items-center justify-center gap-2 pt-2 text-sm">
              {page > 1 ? (
                <Link className="rounded-full border border-primary/30 px-4 py-2 transition hover:bg-surface-dim" href={pageHref(page - 1)}>
                  السابق
                </Link>
              ) : null}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((n) => (
                <Link
                  key={n}
                  href={pageHref(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`h-10 w-10 rounded-full text-center leading-10 transition ${
                    n === page ? "bg-primary font-semibold text-white" : "border border-primary/20 text-ink/70 hover:bg-surface-dim"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {page < totalPages ? (
                <Link className="rounded-full border border-primary/30 px-4 py-2 transition hover:bg-surface-dim" href={pageHref(page + 1)}>
                  التالي
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
