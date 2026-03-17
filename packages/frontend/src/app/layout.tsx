import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "一番くじナビ",
  description: "近くの一番くじ取扱店を探して、お気に入りのくじを予約しよう",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased bg-gray-50`}>
        {/* トップバー */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <span className="text-lg font-bold text-indigo-600 tracking-tight">
              一番くじナビ
            </span>
            <div className="flex items-center gap-1">
              {/* お知らせ */}
              <Link
                href="/notifications/"
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                aria-label="お知らせ"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              </Link>

            </div>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-4">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
