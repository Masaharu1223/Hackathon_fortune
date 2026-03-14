export default function TradePage() {
  return (
    <div className="flex flex-col items-center justify-center pb-20" style={{ height: 'calc(100dvh - 52px - 60px)' }}>
      <div className="rounded-2xl bg-indigo-50 p-5 mb-5">
        <svg className="h-12 w-12 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">景品トレード</h1>
      <p className="text-sm text-gray-400 text-center">
        景品の交換・トレード機能を<br />まもなくお届けします
      </p>
      <span className="mt-4 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-medium text-gray-500">
        Coming Soon
      </span>
    </div>
  );
}
