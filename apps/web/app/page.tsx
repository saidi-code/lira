import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { catalogApi } from "@/lib/catalog";
import type { Product } from "@lira/shared";

export const revalidate = 120;

const imageFor = (product?: Product) =>
  product?.featureImage ||
  product?.colors?.[0]?.featureImage ||
  product?.colors?.[0]?.images?.[0] ||
  product?.images?.[0];

export default async function HomePage() {
  // Every fetch is guarded so a build-time API outage degrades to the page's
  // designed empty state instead of failing `next build` during prerender.
  // products() mirrors the collections()/categories() .catch() below; ISR
  // (revalidate = 120) repopulates real data on the first request after deploy.
  const [{ products }, collections, categories] = await Promise.all([
    catalogApi.products({ limit: 8, page: 1 }).catch(() => ({
      products: [] as Product[],
      pagination: undefined,
    })),
    catalogApi.collections().catch(() => []),
    catalogApi.categories().catch(() => []),
  ]);
  const featuredCollections = collections.filter((item) => item.isFeatured).slice(0, 3);
  const heroCollection = featuredCollections[0];
  const heroProduct = products[0];
  const heroImage = heroCollection?.banner || imageFor(heroProduct);

  return (
    <div className="storefront space-y-16 pb-10 md:space-y-24">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#eee4d8] shadow-card md:min-h-[540px] md:rounded-[36px]">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt={heroCollection?.title || heroProduct?.name || "اختيارات ليرة"}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#241b17]/85 via-[#382c25]/50 to-transparent" />
        {!heroImage ? <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_20%_50%,#d2b992_0%,#8b735e_45%,#42352c_100%)]" /> : null}
        <div className="flex min-h-[440px] items-end px-7 py-10 text-white md:min-h-[540px] md:items-center md:px-16 md:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#e8d5b6] md:text-sm">
              LYRA · اختيارات الموسم
            </p>
            <h1 className="mt-5 font-serif text-4xl leading-[1.35] md:text-6xl">
              {heroCollection?.title || "للجمال حكايةٌ تبدأ من التفاصيل"}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-white/80 md:text-base">
              {heroCollection?.subtitle ||
                "اكتشفوا قطعاً مختارة بعناية، صُممت لترافق لحظاتكم وتبقى قريبة من ذاكرتكم."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                اكتشفوا التشكيلة <span aria-hidden="true">←</span>
              </Link>
              {heroCollection ? (
                <Link href="/shop" className="button-quiet">
                  {heroCollection.cta || "تسوقوا الآن"}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-7 hidden items-center gap-2 text-xs tracking-[0.2em] text-white/70 md:flex">
          <span className="h-px w-10 bg-primary-fixed" />
          01 — LYRA EDITION
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-label="أقسام ليرة" className="space-y-7">
          <SectionHeading
            id="categories-title"
            eyebrow="تصفّحوا حسب الذوق"
            title="أقسام ليرة"
            href="/shop"
            action="كل الأقسام"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.slice(0, 10).map((category, index) => (
              <Link
                key={category._id}
                href={`/shop?category=${encodeURIComponent(category.title)}`}
                className="category-tile group"
              >
                <span className={`category-mark category-mark-${index % 5}`} aria-hidden="true">
                  {category.title.slice(0, 1) || "ل"}
                </span>
                <span className="mt-4 font-serif text-lg">{category.title}</span>
                <span className="mt-1 text-xs text-muted transition group-hover:text-primary-dim">
                  اكتشفوا المجموعة <span aria-hidden="true">←</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featuredCollections.length > 0 ? (
        <section aria-label="مجموعات ليرة" className="space-y-7">
          <SectionHeading
            id="collections-title"
            eyebrow="حكايات منتقاة"
            title="مجموعات صُنعت لتُكتشف"
            href="/shop"
            action="جميع المجموعات"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {featuredCollections.map((collection, index) => (
              <Link
                key={collection._id}
                href="/shop"
                className={`collection-card collection-card-${index + 1}`}
              >
                {collection.banner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={collection.banner} alt={collection.title} loading="lazy" />
                ) : (
                  <div className="collection-placeholder" aria-hidden="true">ليرة</div>
                )}
                <div className="collection-overlay" />
                <div className="collection-copy">
                  <span className="text-xs tracking-[0.2em] text-white/75">المجموعة 0{index + 1}</span>
                  <h3 className="mt-3 font-serif text-2xl">{collection.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/75">{collection.subtitle}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-[#ead8b8]">
                    اكتشف المجموعة <span aria-hidden="true">←</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="المنتجات" className="space-y-7">
        <SectionHeading
          id="new-arrivals-title"
          eyebrow="وصلت حديثاً"
          title="اختيارات تستحق مكاناً في يومكم"
          href="/shop"
          action="تسوقوا كل القطع"
        />
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product: Product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-primary/15 bg-white px-6 py-14 text-center">
            <p className="font-serif text-2xl">تشكيلتنا الجديدة قيد الإعداد</p>
            <p className="mt-2 text-sm text-muted">عودوا قريباً لاكتشاف جديد ليرة.</p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[30px] bg-[#e9e0d4] md:grid md:grid-cols-2 md:rounded-[36px]">
        <div className="relative min-h-[300px] bg-[#d7c8b2] md:min-h-[430px]">
          {imageFor(products[1] || heroProduct) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageFor(products[1] || heroProduct)}
              alt={products[1]?.name || heroProduct?.name || "من عالم ليرة"}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,#d4c2a8,#a48b6b_70%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#241b17]/30 to-transparent" />
          <span className="absolute bottom-6 right-7 text-xs tracking-[0.25em] text-white/80">LYRA · SINCE ALWAYS</span>
        </div>
        <div className="flex flex-col justify-center px-7 py-12 md:px-14 md:py-16">
          <p className="eyebrow">روح ليرة</p>
          <h2 className="mt-4 max-w-lg font-serif text-3xl leading-relaxed md:text-4xl">
            جمالٌ هادئ، وتفاصيل تبقى
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-8 text-muted md:text-base">
            نؤمن أن القطعة الجميلة لا تحتاج إلى أن ترفع صوتها. نختار لكم ما يجمع بين الحضور الأنيق، الجودة، واللمسة التي تشبهكم.
          </p>
          <Link href="/shop" className="mt-8 inline-flex w-fit items-center gap-3 border-b border-primary pb-2 text-sm font-medium text-primary-dim transition hover:gap-5">
            تعرّفوا على اختياراتنا <span aria-hidden="true">←</span>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="ما يميز تجربة ليرة">
        <PromiseCard mark="✦" title="اختيارات بعناية" text="تشكيلة منتقاة لتجدوا ما يليق بذوقكم." />
        <PromiseCard mark="◇" title="تفاصيل تستحق" text="جمال القطعة يبدأ من عنايتها بالتفاصيل." />
        <PromiseCard mark="ل" title="تجربة أقرب إليكم" text="تسوّقوا واكتشفوا عالم ليرة بسهولة." />
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  href,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-2 font-serif text-2xl leading-relaxed md:text-3xl">{title}</h2>
      </div>
      <Link href={href} className="hidden shrink-0 items-center gap-2 border-b border-primary/40 pb-1 text-sm text-primary-dim transition hover:gap-4 sm:inline-flex">
        {action} <span aria-hidden="true">←</span>
      </Link>
    </div>
  );
}

function PromiseCard({ mark, title, text }: { mark: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-primary/10 bg-white/75 p-5 md:p-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-dim font-serif text-xl text-primary-dim">
        {mark}
      </span>
      <div>
        <h3 className="font-serif text-lg">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
      </div>
    </div>
  );
}
