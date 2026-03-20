'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: '在庫検索',
    icon: (active: boolean) => (
      <svg fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    href: '/kuji/',
    label: '一番くじ',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip_kuji)">
          <path d="M10 4L19.5263 14.5H0.473721L10 4Z" fill="currentColor" />
          <path d="M19.1591 7.0369L22.9682 20.3436L6.09854 11.6195L19.1591 7.0369Z" fill="currentColor" />
        </g>
        <defs>
          <clipPath id="clip_kuji">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    href: '/mypage/',
    label: 'マイページ',
    icon: (active: boolean) => (
      <svg fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm safe-area-bottom">
      <div className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href.replace(/\/$/, ''));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors ${
                active ? 'text-brand' : 'text-content-subtle'
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center">
                {item.icon(active)}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
