export default function KujiPage() {
  return (
    <div className="flex flex-col items-center justify-center pb-20" style={{ height: 'calc(100dvh - 52px - 60px)' }}>
      <div className="mb-5 rounded-2xl bg-brand-soft p-5">
        <svg className="h-12 w-12 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>
      <h1 className="mb-2 text-xl font-bold text-content-strong">一番くじ</h1>
      <p className="text-center text-sm text-content-subtle">
        最新の一番くじ情報を<br />まもなくお届けします
      </p>
      <span className="ui-badge ui-badge-neutral mt-4 px-4 py-1.5 text-xs">
        Coming Soon
      </span>
    </div>
  );
}
