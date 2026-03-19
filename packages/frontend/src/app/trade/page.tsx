export default function TradePage() {
  return (
    <div className="flex flex-col items-center justify-center pb-20" style={{ height: 'calc(100dvh - 52px - 60px)' }}>
      <div className="mb-5 rounded-2xl bg-brand-soft p-5">
        <svg className="h-12 w-12 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </div>
      <h1 className="mb-2 text-xl font-bold text-content-strong">景品トレード</h1>
      <p className="text-center text-sm text-content-subtle">
        景品の交換・トレード機能を<br />まもなくお届けします
      </p>
      <span className="ui-badge ui-badge-neutral mt-4 px-4 py-1.5 text-xs">
        Coming Soon
      </span>
    </div>
  );
}
