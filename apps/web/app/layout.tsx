import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "ليرة — Lira",
  description: "بوتيك حِرَفي فاخر — عطور، حرير، جلود نادرة",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Noto+Serif:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ClerkProvider>
          <Providers>
            <Header />
            <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">{children}</main>
            <footer className="border-t border-primary/15 py-10 text-center text-sm text-muted">
              ليرة — بوتيك حِرَفي
            </footer>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
