import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";
import { formatPrice, type Product } from "@lira/shared";

export function ProductsPage() {
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.products(token);
      return asList<Product>(res.data ?? res);
    },
  });

  if (isLoading) return <div className="text-muted">Loading catalog…</div>;
  if (error) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger">
        Failed to load catalog products.
      </div>
    );
  }

  const products = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Products</h1>
          <p className="text-sm text-muted">Manage bespoke catalog items and collections</p>
        </div>
        <span className="rounded-xl bg-surface-dim px-3 py-1.5 text-xs font-semibold text-primary-dim">
          {products.length} Products
        </span>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Product</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-canvas/50">
                  <td className="py-3 font-medium text-ink">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover border border-primary/10"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-dim text-xs text-primary-dim">
                          Lira
                        </div>
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs text-muted">{p.sku || "—"}</td>
                  <td className="py-3 text-muted">
                    {typeof p.category === "object" && p.category !== null && "title" in p.category
                      ? (p.category as { title: string }).title
                      : typeof p.category === "string"
                        ? p.category
                        : "—"}
                  </td>
                  <td className="py-3 font-semibold text-primary">
                    {formatPrice(p.price, "TND")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`font-medium ${
                        (p.stock ?? 0) <= 2 ? "text-danger" : "text-ink"
                      }`}
                    >
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.isActive !== false
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {p.isActive !== false ? "Active" : "Archived"}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No products found in the catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
