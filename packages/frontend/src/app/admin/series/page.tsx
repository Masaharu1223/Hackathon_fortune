'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStore, type KujiSeries } from '@/lib/api';

function SeriesContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId') ?? '';
  const seriesId = searchParams.get('seriesId') ?? '';
  const router = useRouter();

  const [series, setSeries] = useState<KujiSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId || !seriesId) {
      setError('storeId または seriesId が指定されていません');
      setLoading(false);
      return;
    }
    async function fetchSeries() {
      try {
        const store = await getStore(storeId);
        const found = store.series.find((s) => s.seriesId === seriesId) ?? null;
        setSeries(found);
        if (!found) setError('くじシリーズが見つかりません');
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    fetchSeries();
  }, [storeId, seriesId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
        <p className="text-sm text-content-muted">読み込み中...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="ui-panel-danger rounded-xl p-6 text-center">
        <p className="text-sm text-danger">{error ?? 'エラーが発生しました'}</p>
      </div>
    );
  }

  const statusLabels: Record<KujiSeries['status'], string> = {
    upcoming: '発売前',
    on_sale: '販売中',
    sold_out: '完売',
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-content-muted hover:bg-brand-soft hover:text-brand"
          aria-label="戻る"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-content-strong">{series.title}</h1>
          <p className="text-sm text-content-muted">{series.price}円 · {series.releaseDate}</p>
        </div>
      </div>

      <Link
        href={`/admin/board/?storeId=${storeId}&seriesId=${seriesId}`}
        className="ui-button-primary mb-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        ボード読み取りモードへ
      </Link>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-content">在庫状況</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                series.status === 'on_sale'
                  ? 'bg-success-soft text-success'
                  : series.status === 'sold_out'
                  ? 'ui-panel-danger text-danger'
                  : 'ui-panel-muted text-content-muted'
              }`}
            >
              {statusLabels[series.status]}
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-content-strong">{series.remainingTickets}</span>
            <span className="mb-0.5 text-sm text-content-muted">/ {series.totalTickets} 枚</span>
          </div>
        </div>

        {series.prizes.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-sm font-medium text-content">賞品一覧</p>
            <div className="space-y-2">
              {series.prizes.map((prize) => (
                <div key={prize.rank} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-sm font-semibold text-brand">{prize.rank}賞</span>
                    <span className="text-sm text-content">{prize.name}</span>
                  </div>
                  <span className="text-sm text-content-muted">
                    残{prize.remaining ?? prize.quantity} / {prize.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
          <p className="text-sm text-content-muted">読み込み中...</p>
        </div>
      }
    >
      <SeriesContent />
    </Suspense>
  );
}
