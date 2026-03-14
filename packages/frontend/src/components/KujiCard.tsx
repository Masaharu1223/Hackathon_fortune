'use client';

import type { KujiSeries } from '@/lib/api';

function statusBadge(status: string) {
  switch (status) {
    case 'on_sale':
      return (
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          販売中
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          発売予定
        </span>
      );
    case 'sold_out':
      return (
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">
          完売
        </span>
      );
    default:
      return null;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

interface KujiCardProps {
  series: KujiSeries;
  storeId?: string;
  onReserve?: (seriesId: string) => void;
}

export default function KujiCard({ series, onReserve }: KujiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{series.title}</h3>
        {statusBadge(series.status)}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="text-gray-400">発売日: </span>
          {formatDate(series.release_date)}
        </div>
        <div>
          <span className="text-gray-400">残り: </span>
          <span className={series.remaining_tickets <= 5 ? 'font-bold text-red-500' : ''}>
            {series.remaining_tickets}
          </span>
          <span className="text-gray-400"> / {series.total_tickets}枚</span>
        </div>
      </div>

      {series.prizes && series.prizes.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
            賞品一覧
          </h4>
          <div className="space-y-1">
            {series.prizes.map((prize) => (
              <div
                key={prize.rank}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-indigo-600">{prize.rank}賞</span>
                  <span className="text-gray-700">{prize.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  残 {prize.remaining}/{prize.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {series.status === 'on_sale' && onReserve && (
        <button
          onClick={() => onReserve(series.series_id)}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700"
        >
          予約する
        </button>
      )}
    </div>
  );
}
