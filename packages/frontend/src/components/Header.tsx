'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isLoggedIn, logout } from '@/lib/auth';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = typeof window !== 'undefined' ? isLoggedIn() : false;

  return (
    <header className="sticky top-0 z-50 bg-brand text-on-brand shadow-lg">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          一番くじナビ
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 transition-colors hover:bg-brand-hover md:hidden"
          aria-label="メニュー"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/" className="transition-colors hover:text-brand-soft">
            店舗検索
          </Link>
          <Link href="/watchlist/" className="transition-colors hover:text-brand-soft">
            ウォッチリスト
          </Link>
          <Link href="/reservations/" className="transition-colors hover:text-brand-soft">
            予約一覧
          </Link>
          {loggedIn ? (
            <button
              onClick={logout}
              className="rounded-full bg-brand-hover px-4 py-1.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand"
            >
              ログアウト
            </button>
          ) : (
            <Link
              href="/login/"
              className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>

      {menuOpen && (
        <nav className="border-t border-brand-hover px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2 transition-colors hover:bg-brand-hover"
            >
              店舗検索
            </Link>
            <Link
              href="/watchlist/"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2 transition-colors hover:bg-brand-hover"
            >
              ウォッチリスト
            </Link>
            <Link
              href="/reservations/"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2 transition-colors hover:bg-brand-hover"
            >
              予約一覧
            </Link>
            {loggedIn ? (
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="rounded-md px-3 py-2 text-left transition-colors hover:bg-brand-hover"
              >
                ログアウト
              </button>
            ) : (
              <Link
                href="/login/"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 transition-colors hover:bg-brand-hover"
              >
                ログイン
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
