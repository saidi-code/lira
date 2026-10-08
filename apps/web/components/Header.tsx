"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/lib/shop";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "الكتالوج" },
  { href: "/wishlist", label: "المفضلة" },
  { href: "/cart", label: "حقيبة التسوق" },
  { href: "/orders", label: "طلباتي" },
];

export function Header() {
  const { getToken, isSignedIn } = useAuth();
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    enabled: Boolean(isSignedIn),
    queryFn: async () => cartApi.get(await getToken()),
  });
  const count = cart?.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="font-serif text-3xl tracking-wide text-primary-dim">
          ليرة
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-primary"
            >
              {item.label}
              {item.href === "/cart" && count > 0 ? (
                <span className="mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              href="/sign-in"
              className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary"
            >
              دخول
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-primary/10 px-5 py-2 text-xs text-muted md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
