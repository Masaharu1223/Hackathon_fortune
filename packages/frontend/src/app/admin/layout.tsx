import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="トップに戻る"
            className="flex h-9 w-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-brand-soft hover:text-brand"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <span className="text-base font-semibold text-content-strong">スタッフ管理画面</span>
        </div>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
