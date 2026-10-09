import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "ليرة — Lyra",
  description: "بوتيك حِرَفي فاخر — عطور، حرير، جلود نادرة",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Google Fonts are linked here (not via `next/font`) so builds do not
            require network access to fonts.googleapis.com. The CSS variables
            below are the single source of truth for the storefront type
            families; `tailwind.config.ts` and `globals.css` both read them. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-canvas font-sans text-ink antialiased"
        style={
          {
            "--font-display": '"Reem Kufi", "Noto Serif", serif',
            "--font-body": '"Cairo", "IBM Plex Sans Arabic", system-ui, sans-serif',
          } as React.CSSProperties
        }
      >
        <ClerkProvider>
          <Providers>
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-7 md:px-8 md:py-12">{children}</main>
            <footer className="mt-10 border-t border-primary/15 bg-[#f8f1e9]">
              <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8 md:py-16">
                <div>
                  <Link href="/" className="flex items-center gap-3" aria-label="ليرة — الرئيسية">
                    <Image src="/images/lira_logo.png" alt="ليرة" width={48} height={48} className="h-12 w-12 object-contain" />
                  </Link>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                    اختيارات هادئة، وتفاصيل صُنعت لتبقى قريبة منكم.
                  </p>
                  <div className="mt-5">
                    <h2 className="font-serif text-lg">تابعونا</h2>
                    <div className="mt-3 flex items-center gap-3">
                      <a
                        href="https://www.instagram.com/lira__luxe/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="ليرة على إنستغرام"
                        title="إنستغرام"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 text-primary-dim transition hover:border-primary hover:bg-primary hover:text-white"
                      >
                        <InstagramIcon />
                      </a>
                      <a
                        href="https://www.facebook.com/profile.php?id=61589393636721"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="ليرة على فيسبوك"
                        title="فيسبوك"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 text-primary-dim transition hover:border-primary hover:bg-primary hover:text-white"
                      >
                        <FacebookIcon />
                      </a>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="font-serif text-lg">روابط ليرة</h2>
                  <div className="mt-4 grid gap-3 text-sm text-muted">
                    <Link href="/shop" className="transition hover:text-primary-dim">تسوّقوا</Link>
                    <Link href="/#collections-title" className="transition hover:text-primary-dim">المجموعات</Link>
                    <Link href="/#new-arrivals-title" className="transition hover:text-primary-dim">وصل حديثاً</Link>
                  </div>
                </div>
                <div>
                  <h2 className="font-serif text-lg">حسابكم</h2>
                  <div className="mt-4 grid gap-3 text-sm text-muted">
                    <Link href="/wishlist" className="transition hover:text-primary-dim">المفضلة</Link>
                    <Link href="/cart" className="transition hover:text-primary-dim">حقيبة التسوق</Link>
                    <Link href="/orders" className="transition hover:text-primary-dim">طلباتي</Link>
                  </div>
                </div>
                <div>
                  <h2 className="font-serif text-lg">هل تحتاجون إلى مساعدة؟</h2>
                  <p className="mt-4 text-sm leading-7 text-muted">نحن هنا لمساعدتكم في اكتشاف القطعة المناسبة وإتمام طلبكم.</p>
                  <Link href="/shop" className="mt-3 inline-flex items-center gap-2 text-sm text-primary-dim">تواصلوا معنا <span aria-hidden="true">←</span></Link>
                </div>
              </div>
              <div className="border-t border-primary/10 px-5 py-4 text-center text-xs text-muted">
                © {new Date().getFullYear()} ليرة · جميع الحقوق محفوظة
              </div>
            </footer>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}

// Social icons — stroke-based line icons to match the house style (search,
// bag, heart in the Header are all stroked, not filled). Current color is
// inherited from the anchor's text color and hover state.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M14 8.5V7c0-.8.5-1.2 1.3-1.2H17V3h-2.6C12 3 10.8 4.4 10.8 6.6v1.9H8.5V12h2.3v9h3.2v-9h2.4l.4-3.5h-2.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
