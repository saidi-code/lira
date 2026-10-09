import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";

interface InventoryItem {
  _id: string;
  product?: { _id: string; name: string; sku?: string };
  sku: string;
  warehouse?: { _id: string; name: string };
  quantity: number;
  reserved: number;
  reorderLevel: number;
}

interface StockMovementItem {
  _id: string;
  product?: { _id: string; name: string };
  sku?: string | null;
  warehouse?: { _id: string; name: string };
  type: string;
  quantity: number;
  reference?: string;
  note?: string;
  createdAt?: string;
}

export function InventoryPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  const inventoryQuery = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.inventory(token);
      return asList<InventoryItem>(res.data ?? res);
    },
  });

  const lowStockQuery = useQuery({
    queryKey: ["admin", "lowStock"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.lowStock(token);
      return asList<InventoryItem>(res.data ?? res);
    },
  });

  const movementsQuery = useQuery({
    queryKey: ["admin", "movements"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.movements(token);
      return asList<StockMovementItem>(res.data ?? res);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      productId: string;
      sku: string;
      warehouseId: string;
      quantity: number;
      reason: string;
    }) => {
      const token = await getToken();
      return adminApi.adjust(payload, token);
    },
    onSuccess: () => {
      setAdjusting(null);
      setDelta(0);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "movements"] });
    },
  });

  const inventory = inventoryQuery.data ?? [];
  const lowStock = lowStockQuery.data ?? [];
  const movements = movementsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Inventory & Ledger</h1>
        <p className="text-sm text-muted">Event-sourced stock ledger, holds & warehouse audits</p>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 shadow-card">
          <h2 className="font-serif text-lg font-medium text-danger">Low Stock Alerts ({lowStock.length})</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {lowStock.map((item) => (
              <span
                key={item._id}
                className="inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-white px-3 py-1.5 text-xs font-semibold text-danger"
              >
                <span>{item.product?.name || "Product"}</span>
                <span className="rounded-full bg-danger/10 px-2 py-0.5">
                  Available: {item.quantity - item.reserved}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <h2 className="font-serif text-xl font-medium text-ink">Stock Levels by Warehouse</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Product</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Warehouse</th>
                <th className="pb-3">On Hand</th>
                <th className="pb-3">Reserved (Hold)</th>
                <th className="pb-3">Available</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {inventory.map((row) => {
                const available = row.quantity - row.reserved;
                return (
                  <tr key={row._id} className="hover:bg-canvas/50">
                    <td className="py-3 font-medium text-ink">
                      {row.product?.name || "Product"}
                    </td>
                    <td className="py-3 font-mono text-xs text-muted">{row.sku}</td>
                    <td className="py-3 text-muted">{row.warehouse?.name || "Default"}</td>
                    <td className="py-3 text-ink font-semibold">{row.quantity}</td>
                    <td className="py-3 text-muted">{row.reserved}</td>
                    <td className="py-3">
                      <span
                        className={`font-bold ${
                          available <= row.reorderLevel ? "text-danger" : "text-primary"
                        }`}
                      >
                        {available}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setAdjusting(row);
                          setDelta(0);
                          setReason("");
                        }}
                        className="rounded-lg border border-primary/30 bg-surface-dim px-3 py-1 text-xs font-medium text-primary-dim hover:bg-primary hover:text-white transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card">
        <h2 className="font-serif text-xl font-medium text-ink">Recent Movements Ledger</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                <th className="pb-3">Type</th>
                <th className="pb-3">Product</th>
                <th className="pb-3">Warehouse</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Reference / Note</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-canvas/50">
                  <td className="py-3">
                    <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-semibold text-primary-dim">
                      {m.type}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-ink">{m.product?.name || "—"}{m.sku ? ` · ${m.sku}` : ""}</td>
                  <td className="py-3 text-muted">{m.warehouse?.name || "—"}</td>
                  <td className="py-3 font-mono font-semibold text-ink">{m.quantity}</td>
                  <td className="py-3 text-xs text-muted">
                    {m.reference ? `${m.reference} ` : ""}
                    {m.note ? `(${m.note})` : ""}
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : "—"}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    No stock movements recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-semibold text-ink">Adjust Stock</h3>
            <p className="mt-1 text-xs text-muted">
              {adjusting.product?.name} at {adjusting.warehouse?.name}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted">
                  Adjustment Quantity (Signed, e.g. +5 or -2)
                </label>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-primary/20 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-muted">Reason</label>
                <input
                  type="text"
                  placeholder="Audit discrepancy, breakage, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-primary/20 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAdjusting(null)}
                className="rounded-xl border border-primary/20 px-4 py-2 text-sm text-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                disabled={adjustMutation.isLoading || delta === 0}
                onClick={() => {
                  if (!adjusting.product?._id || !adjusting.warehouse?._id) return;
                  adjustMutation.mutate({
                    productId: adjusting.product._id,
                    sku: adjusting.sku,
                    warehouseId: adjusting.warehouse._id,
                    quantity: delta,
                    reason: reason || "Manual adjustment",
                  });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/20 hover:bg-primary-dim transition-colors disabled:opacity-50"
              >
                Save Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
