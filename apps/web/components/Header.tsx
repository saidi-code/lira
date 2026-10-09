"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/catalog";
import { cartApi, wishlistApi } from "@/lib/shop";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "تسوّقوا" },
  { href: "/#new-arrivals-title", label: "وصل حديثاً" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/orders", label: "طلباتي" },
];

export function Header() {
  const { getToken, isSignedIn } = useAuth();
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    enabled: Boolean(isSignedIn),
    queryFn: async () => cartApi.get(await getToken()),
  });
  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    enabled: Boolean(isSignedIn),
    queryFn: async () => wishlistApi.get(await getToken()),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: () => catalogApi.categories().catch(() => []),
    staleTime: 1000 * 60 * 10,
  });

  const cartCount =
    cart?.items?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0;
  const wishlistCount = wishlist?.items?.length ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-canvas/95 backdrop-blur-xl">
      <div className="announcement-bar px-4 py-2 text-center text-[11px] tracking-wide sm:text-xs">
        <span>أهلاً بكم في ليرة</span>
        <span className="mx-3 text-primary-fixed" aria-hidden="true">✦</span>
        <span>تفاصيل مختارة بذوق هادئ</span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <Link href="/" aria-label="ليرة — الرئيسية" className="flex shrink-0 items-center gap-2">
          <Image src="/images/lira_logo.png" alt="ليرة" width={128} height={128} priority className="h-32 w-23 object-contain md:h-12 md:w-12" />
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-7 text-sm text-ink/80 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/shop" role="search" className="hidden min-w-44 max-w-xs flex-1 items-center rounded-full border border-primary/15 bg-white/75 px-4 py-2.5 xl:flex">
          <label htmlFor="store-search" className="sr-only">ابحثوا في المتجر</label>
          <input id="store-search" name="q" placeholder="ما الذي تبحثون عنه؟" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" />
          <button type="submit" aria-label="بحث" className="text-primary-dim transition hover:text-primary">
            <SearchIcon />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-2.5">
          <SignedOut>
            <Link href="/sign-in" className="hidden rounded-full border border-primary/30 px-4 py-2 text-sm text-primary-dim transition hover:bg-surface-dim sm:inline-flex">
              دخول
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <Link
            href="/wishlist"
            aria-label={`المفضلة${wishlistCount ? `، ${wishlistCount} قطعة` : ""}`}
            className="header-action"
          >
            <HeartIcon />
            {wishlistCount > 0 ? (
              <span className="badge-count" aria-hidden="true">{wishlistCount}</span>
            ) : null}
          </Link>

          <Link
            href="/cart"
            aria-label={`حقيبة التسوق${cartCount ? `، ${cartCount} قطعة` : ""}`}
            className="header-action"
          >
            <BagIcon />
            {cartCount > 0 ? (
              <span className="badge-count" aria-hidden="true">{cartCount}</span>
            ) : null}
          </Link>
        </div>
      </div>

      {categories.length > 0 ? (
        <nav aria-label="تصفح الفئات" className=" mx-auto flex max-w-7xl items-center  gap-4 px-4 py-3 md:px-8 md:py-4 menu-bar">
          <Link href="/shop" className="menu-chip">كل الأقسام</Link>
          {categories.slice(0, 12).map((category) => (
            <Link
              key={category._id}
              href={`/shop?category=${encodeURIComponent(category.title)}`}
              className="menu-chip"
            >
              {category.title}
            </Link>
          ))}
        </nav>
      ) : null}

      <nav aria-label="التنقل على الهاتف" className="flex gap-6 overflow-x-auto border-t border-primary/10 px-5 py-2.5 text-xs text-muted lg:hidden">
        {NAV.map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-primary-dim">{item.label}</Link>)}
      </nav>
    </header>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.5" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function BagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5"><path d="M5 8.5h14l1 12H4l1-12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5"><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 7.8a4.1 4.1 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}
