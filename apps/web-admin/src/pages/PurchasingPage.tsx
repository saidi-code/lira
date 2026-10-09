import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, asList } from "@/lib/adminApi";
import { formatPrice } from "@lira/shared";

interface Supplier {
  _id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
}

interface PurchaseOrderItem {
  product: { _id: string; name: string };
  sku?: string;
  quantity: number;
  unitCost: number;
  receivedQty: number;
}

interface PurchaseOrder {
  _id: string;
  poNumber?: string;
  supplier?: { name: string };
  status: string;
  items: PurchaseOrderItem[];
  totals?: { grandTotal: number };
  createdAt?: string;
}

export function PurchasingPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const poQuery = useQuery({
    queryKey: ["admin", "purchaseOrders"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.purchaseOrders(token);
      return asList<PurchaseOrder>(res.data ?? res);
    },
  });

  const suppliersQuery = useQuery({
    queryKey: ["admin", "suppliers"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.suppliers(token);
      return asList<Supplier>(res.data ?? res);
    },
  });

  const warehousesQuery = useQuery({
    queryKey: ["admin", "warehouses"],
    queryFn: async () => {
      const token = await getToken();
      const res = await adminApi.warehouses(token);
      return asList<{ _id: string; name: string; isDefault?: boolean }>(res.data ?? res);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async ({
      id,
      warehouseId,
      items,
    }: {
      id: string;
      warehouseId: string;
      items: { productId: string; sku?: string; quantity: number }[];
    }) => {
      const token = await getToken();
      return adminApi.receivePo(id, { warehouseId, items }, token);
    },
    onSuccess: () => {
      setReceivingPo(null);
      setQuantities({});
      queryClient.invalidateQueries({ queryKey: ["admin", "purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });

  const pos = poQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Purchasing & Suppliers</h1>
        <p className="text-sm text-muted">Purchase orders, supplier relationships & stock receiving</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card lg:col-span-1">
          <h2 className="font-serif text-xl font-medium text-ink">Artisans & Suppliers</h2>
          <div className="mt-4 space-y-3">
            {suppliers.map((s) => (
              <div key={s._id} className="rounded-xl border border-primary/10 bg-canvas/40 p-3">
                <p className="font-medium text-ink">{s.name}</p>
                <p className="text-xs text-muted">{s.contact || s.email || s.phone || "No contact info"}</p>
              </div>
            ))}
            {suppliers.length === 0 && (
              <p className="text-sm text-muted">No suppliers registered.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="font-serif text-xl font-medium text-ink">Purchase Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-xs font-semibold uppercase text-muted">
                  <th className="pb-3">PO Number</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {pos.map((po) => {
                  const isReceivable = po.status !== "received" && po.status !== "cancelled";
                  return (
                    <tr key={po._id} className="hover:bg-canvas/50">
                      <td className="py-3 font-medium text-primary-dim">
                        {po.poNumber || po._id.slice(-6)}
                      </td>
                      <td className="py-3 text-ink">{po.supplier?.name || "—"}</td>
                      <td className="py-3 text-xs text-muted">
                        {po.items.map((i) => (
                          <div key={`${i.product?._id}-${i.sku}`}>
                            {i.product?.name} ({i.sku ?? "legacy SKU"}): {i.receivedQty}/{i.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="py-3">
                        <span className="inline-block rounded-full bg-surface-dim px-2.5 py-0.5 text-xs font-medium text-primary-dim">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {isReceivable && (
                          <button
                            onClick={() => {
                              setReceivingPo(po);
                              const defaultWh = warehouses.find((w) => w.isDefault)?._id || warehouses[0]?._id || "";
                              setTargetWarehouse(defaultWh);
                              const initQty: Record<string, number> = {};
                              po.items.forEach((i) => {
                                initQty[`${i.product._id}::${i.sku ?? ""}`] = i.quantity - i.receivedQty;
                              });
                              setQuantities(initQty);
                            }}
                            className="rounded-lg border border-primary/30 bg-surface-dim px-3 py-1 text-xs font-medium text-primary-dim hover:bg-primary hover:text-white transition-colors"
                          >
                            Receive Goods
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No purchase orders recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-primary/20 bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Receive Purchase Order ({receivingPo.poNumber || receivingPo._id.slice(-6)})
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted">Destination Warehouse</label>
                <select
                  value={targetWarehouse}
                  onChange={(e) => setTargetWarehouse(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} {w.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted">Receive Quantities</label>
                <div className="mt-2 space-y-2">
                  {receivingPo.items.map((i) => {
                    const remaining = i.quantity - i.receivedQty;
                    return (
                      <div key={`${i.product._id}-${i.sku}`} className="flex items-center justify-between gap-4">
                        <span className="text-sm text-ink">{i.product.name} · {i.sku ?? "legacy SKU"} (Max {remaining})</span>
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={quantities[`${i.product._id}::${i.sku ?? ""}`] ?? 0}
                          onChange={(e) =>
                            setQuantities({
                              ...quantities,
                              [`${i.product._id}::${i.sku ?? ""}`]: Number(e.target.value),
                            })
                          }
                          className="w-24 rounded-lg border border-primary/20 px-2 py-1 text-sm text-right focus:border-primary focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setReceivingPo(null)}
                className="rounded-xl border border-primary/20 px-4 py-2 text-sm text-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <button
                disabled={receiveMutation.isLoading || !targetWarehouse}
                onClick={() => {
                  const items = Object.entries(quantities)
                    .filter(([_, q]) => q > 0)
                    .map(([key, quantity]) => {
                      const [productId, sku] = key.split("::");
                      return { productId, ...(sku ? { sku } : {}), quantity };
                    });
                  if (items.length === 0) return;
                  receiveMutation.mutate({
                    id: receivingPo._id,
                    warehouseId: targetWarehouse,
                    items,
                  });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/20 hover:bg-primary-dim transition-colors disabled:opacity-50"
              >
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
