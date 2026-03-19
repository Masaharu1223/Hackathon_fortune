'use client';

import type { KujiSeries } from '@/lib/api';

function statusBadge(status: string) {
  switch (status) {
    case 'on_sale':
      return (
        <span className="ui-badge ui-badge-success px-3 py-1 text-sm">
          販売中
        </span>
      );
    case 'upcoming':
      return (
        <span className="ui-badge ui-badge-info px-3 py-1 text-sm">
          発売予定
        </span>
      );
    case 'sold_out':
      return (
        <span className="ui-badge ui-badge-neutral px-3 py-1 text-sm">
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
    <div className="ui-card rounded-xl p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-content-strong">{series.title}</h3>
        {statusBadge(series.status)}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-content">
        <div>
          <span className="text-content-subtle">発売日: </span>
          {formatDate(series.release_date)}
        </div>
        <div>
          <span className="text-content-subtle">残り: </span>
          <span className={series.remaining_tickets <= 5 ? 'font-bold text-danger' : ''}>
            {series.remaining_tickets}
          </span>
          <span className="text-content-subtle"> / {series.total_tickets}枚</span>
        </div>
      </div>

      {series.prizes && series.prizes.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-content-subtle">
            賞品一覧
          </h4>
          <div className="space-y-1">
            {series.prizes.map((prize) => (
              <div
                key={prize.rank}
                className="flex items-center justify-between rounded-lg bg-brand-soft px-3 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand">{prize.rank}賞</span>
                  <span className="text-content">{prize.name}</span>
                </div>
                <span className="text-xs text-content-subtle">
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
          className="ui-button-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
        >
          予約する
        </button>
      )}
    </div>
  );
}
