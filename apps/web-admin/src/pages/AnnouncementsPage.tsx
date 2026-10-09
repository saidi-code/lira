import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi } from "@/lib/adminApi";

type BroadcastResult = { recipients: number; delivery: { accepted: number; failed: number } };

export function AnnouncementsPage() {
  const { getToken } = useAuth();
  const [type, setType] = useState<"promotion" | "new_product">("promotion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [productId, setProductId] = useState("");
  const send = useMutation({
    mutationFn: async () => adminApi.broadcastNotification({
      type,
      title: title.trim(),
      body: body.trim(),
      ...(type === "new_product" ? { productId: productId.trim() } : {}),
    }, await getToken()),
  });

  const result = send.data as BroadcastResult | undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Customer announcements</h1>
        <p className="mt-2 text-sm text-muted">Publish a promotion or tell customers about a new product.</p>
      </div>
      <form
        className="space-y-5 rounded-2xl border border-primary/15 bg-white p-6 shadow-card"
        onSubmit={(event) => {
          event.preventDefault();
          send.mutate();
        }}
      >
        <label className="block text-sm font-medium text-ink">
          Announcement type
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="mt-2 w-full rounded-xl border border-primary/15 bg-white px-3 py-2.5">
            <option value="promotion">Promotion</option>
            <option value="new_product">New product</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required className="mt-2 w-full rounded-xl border border-primary/15 px-3 py-2.5" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Message
          <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} required rows={4} className="mt-2 w-full rounded-xl border border-primary/15 px-3 py-2.5" />
        </label>
        {type === "new_product" && (
          <label className="block text-sm font-medium text-ink">
            Active product ID
            <input value={productId} onChange={(event) => setProductId(event.target.value)} required className="mt-2 w-full rounded-xl border border-primary/15 px-3 py-2.5" />
          </label>
        )}
        {send.isError && <p className="text-sm text-danger">Could not send this announcement. Check the product ID and try again.</p>}
        {result && <p className="text-sm text-emerald-700">Saved for {result.recipients} devices; Expo accepted {result.delivery.accepted} push messages.</p>}
        <button disabled={send.isLoading} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">
          {send.isLoading ? "Sending…" : "Send announcement"}
        </button>
      </form>
    </div>
  );
}
