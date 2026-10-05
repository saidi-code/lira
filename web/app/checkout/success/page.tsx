import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg rounded-[32px] bg-white p-12 text-center shadow-glow">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">تم الاستلام</p>
      <h1 className="mt-4 font-serif text-3xl">شكراً لثقتك بليرة</h1>
      <p className="mt-3 text-muted">
        وصلك الطلب وهو قيد التجهيز في المشغل. الدفع عند الاستلام.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/orders" className="rounded-xl bg-primary py-3 text-white">
          متابعة الطلب
        </Link>
        <Link href="/shop" className="rounded-xl border border-primary/40 py-3 text-primary">
          مواصلة التسوّق
        </Link>
      </div>
    </div>
  );
}
