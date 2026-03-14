import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
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
          <div className="mx-auto flex max-w-md items-center px-4 py-3">
            <span className="text-lg font-bold text-indigo-600 tracking-tight">
              一番くじナビ
            </span>
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
