'use client';

import type { KujiSeries } from '@/lib/api';

function statusBadge(status: string) {
  switch (status) {
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
  onReserve?: (series: KujiSeries) => void;
  isReserved?: boolean;
  reservationPending?: boolean;
  isWatchlisted?: boolean;
  isWatchlistPending?: boolean;
  onToggleWatchlist?: (series: KujiSeries) => void;
}

export default function KujiCard({
  series,
  onReserve,
  isReserved = false,
  reservationPending = false,
  isWatchlisted = false,
  isWatchlistPending = false,
  onToggleWatchlist,
}: KujiCardProps) {
  const showWatchlistButton =
    !!onToggleWatchlist && (series.status === 'on_sale' || series.status === 'upcoming');

  return (
    <div className="ui-card rounded-xl p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-content-strong">{series.title}</h3>
        {statusBadge(series.status)}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-content">
        <div>
          <span className="text-content-subtle">発売日: </span>
          {formatDate(series.releaseDate)}
        </div>
        <div>
          <span className="text-content-subtle">残り: </span>
          <span className={series.remainingTickets <= 5 ? 'font-bold text-danger' : ''}>
            {series.remainingTickets}
          </span>
          <span className="text-content-subtle"> / {series.totalTickets}枚</span>
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
                  {prize.remaining !== undefined
                    ? `残 ${prize.remaining}/${prize.quantity}`
                    : `全 ${prize.quantity}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {series.status === 'on_sale' && (
        <div className="flex items-center gap-2">
          {showWatchlistButton && (
            <button
              type="button"
              onClick={() => onToggleWatchlist(series)}
              disabled={isWatchlistPending}
              aria-label={isWatchlisted ? 'ウォッチリストから削除' : 'ウォッチリストに追加'}
              title={isWatchlisted ? 'ウォッチリストから削除' : 'ウォッチリストに追加'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isWatchlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-500'
                  : 'border-border bg-surface text-content-subtle hover:border-rose-200 hover:text-rose-500'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill={isWatchlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12 20.25-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 2C19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.43L12 20.25Z"
                />
              </svg>
            </button>
          )}
          <div className="flex w-full items-center justify-center rounded-lg bg-success-soft px-4 py-2.5 text-sm font-medium text-success">
            販売中
          </div>
        </div>
      )}

      {series.status === 'upcoming' && reservationPending && (
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface" />
      )}

      {series.status === 'upcoming' && !reservationPending && (onReserve || isReserved) && (
        <div className="flex items-center gap-2">
          {showWatchlistButton && (
            <button
              type="button"
              onClick={() => onToggleWatchlist(series)}
              disabled={isWatchlistPending}
              aria-label={isWatchlisted ? 'ウォッチリストから削除' : 'ウォッチリストに追加'}
              title={isWatchlisted ? 'ウォッチリストから削除' : 'ウォッチリストに追加'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isWatchlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-500'
                  : 'border-border bg-surface text-content-subtle hover:border-rose-200 hover:text-rose-500'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill={isWatchlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12 20.25-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09A6 6 0 0 1 16.5 2C19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.43L12 20.25Z"
                />
              </svg>
            </button>
          )}
          {isReserved ? (
            <a
              href="/reservations/"
              className="block w-full rounded-lg bg-gray-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-600"
            >
              予約内容を確認
            </a>
          ) : (
            onReserve && (
              <button
                onClick={() => onReserve(series)}
                className="ui-button-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
              >
                購入権利を予約
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
