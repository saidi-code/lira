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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl">الكتالوج</h1>
        <p className="mt-1 text-muted">قطع مختارة بعناية</p>
      </header>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="بحث..."
          className="flex-1 rounded-xl border border-primary/20 bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          name="category"
          defaultValue={searchParams.category ?? ""}
          className="rounded-xl border border-primary/20 bg-white px-4 py-3"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c._id} value={c.title}>
              {c.title}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-primary px-6 py-3 font-medium text-white">
          تصفية
        </button>
      </form>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>

      {pagination && (pagination.totalPages ?? pagination.pages ?? 1) > 1 ? (
        <div className="flex justify-center gap-3 text-sm">
          {page > 1 ? (
            <a
              className="rounded-lg border border-primary/30 px-4 py-2"
              href={`/shop?page=${page - 1}`}
            >
              السابق
            </a>
          ) : null}
          <span className="px-4 py-2 text-muted">صفحة {page}</span>
          {page < (pagination.totalPages ?? pagination.pages ?? 1) ? (
            <a
              className="rounded-lg border border-primary/30 px-4 py-2"
              href={`/shop?page=${page + 1}`}
            >
              التالي
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
