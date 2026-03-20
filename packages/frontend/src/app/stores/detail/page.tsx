'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  addToWatchlist,
  createReservation,
  getStore,
  getWatchlist,
  removeFromWatchlist,
  type KujiSeries,
  type Store,
} from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { addMyStore, isMyStore, removeMyStore } from '@/lib/myStores';
import KujiCard from '@/components/KujiCard';

function StoreDetailContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('id') || '';
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reserveTarget, setReserveTarget] = useState<KujiSeries | null>(null);
  const [drawCount, setDrawCount] = useState(1);
  const [watchlistSeriesIds, setWatchlistSeriesIds] = useState<string[]>([]);
  const [watchlistUpdatingId, setWatchlistUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(storeId ? isMyStore(storeId) : false);
  }, [storeId]);

  useEffect(() => {
    if (!reserveTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !reserving) {
        setReserveTarget(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reserveTarget, reserving]);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    let isActive = true;

    async function fetchStore() {
      setLoading(true);
      setError(null);

      try {
        const data = await getStore(storeId);
        if (!isActive) return;
        setStore(data);
      } catch {
        if (!isActive) return;
        setStore(null);
        setError('店舗情報の取得に失敗しました。');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchStore();

    return () => {
      isActive = false;
    };
  }, [storeId]);

  useEffect(() => {
    if (!isLoggedIn()) return;

    let isActive = true;

    async function fetchWatchlist() {
      try {
        const items = await getWatchlist();
        if (!isActive) return;
        setWatchlistSeriesIds(items.map((item) => item.seriesId));
      } catch {
        // Keep the detail view usable even if watchlist hydration fails.
      }
    }

    fetchWatchlist();

    return () => {
      isActive = false;
    };
  }, []);

  const handleReserve = async (series: KujiSeries) => {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return;
    }

    setReserveTarget(series);
    setDrawCount(1);
  };

  const updateDrawCount = (next: number) => {
    setDrawCount(Math.min(3, Math.max(1, next)));
  };

  const handleConfirmReserve = async () => {
    if (!reserveTarget) return;

    setReserving(reserveTarget.seriesId);
    try {
      await createReservation(storeId, reserveTarget.seriesId, drawCount);
      alert('購入権利の予約が完了しました。抽選結果は予約一覧で確認できます。');
      setReserveTarget(null);
      try {
        const data = await getStore(storeId);
        setStore(data);
      } catch {
        // Keep current UI state when the API refresh is unavailable.
      }
    } catch {
      alert('購入権利の予約に失敗しました。もう一度お試しください。');
    } finally {
      setReserving(null);
    }
  };

  const handleToggleFavorite = () => {
    if (!store) return;

    if (isFavorite) {
      removeMyStore(store.storeId);
      setIsFavorite(false);
      return;
    }

    addMyStore(store.storeId);
    setIsFavorite(true);
  };

  const handleToggleWatchlist = async (series: KujiSeries) => {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return;
    }

    const isWatchlisted = watchlistSeriesIds.includes(series.seriesId);

    setWatchlistUpdatingId(series.seriesId);
    try {
      if (isWatchlisted) {
        await removeFromWatchlist(series.seriesId);
        setWatchlistSeriesIds((prev) => prev.filter((id) => id !== series.seriesId));
      } else {
        await addToWatchlist(series.seriesId, series.title);
        setWatchlistSeriesIds((prev) => [...prev, series.seriesId]);
      }
    } catch {
      alert(
        isWatchlisted
          ? 'ウォッチリストからの削除に失敗しました。'
          : 'ウォッチリストへの追加に失敗しました。',
      );
    } finally {
      setWatchlistUpdatingId(null);
    }
  };

  if (!storeId) {
    return (
      <div className="ui-panel-warning rounded-xl p-6 text-center">
        <p className="text-sm text-warning">店舗IDが指定されていません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
        <p className="text-sm text-content-muted">読み込み中...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="ui-panel-danger rounded-xl p-6 text-center">
        <p className="text-sm text-danger">{error || '店舗が見つかりません'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-content-strong">{store.storeName}</h1>
          <p className="mt-1 text-sm text-content-muted">{store.address}</p>
        </div>
        <button
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
          title={isFavorite ? 'お気に入り解除' : 'お気に入り登録'}
          className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
            isFavorite
              ? 'border-brand-border bg-brand-soft text-brand'
              : 'border-border bg-surface text-content-subtle hover:border-brand-border hover:text-brand'
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321 1.003l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.55a.562.562 0 0 1-.84-.61l1.285-5.385a.563.563 0 0 0-.182-.557L3.041 10.396a.562.562 0 0 1 .321-1.003l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-content-strong">取扱くじ一覧</h2>
      </div>

      {store.series && store.series.length > 0 ? (
        <div className="space-y-4">
          {store.series.map((series) => (
            <div key={series.seriesId} className="relative">
              <KujiCard
                series={series}
                storeId={store.storeId}
                onReserve={handleReserve}
                isWatchlisted={watchlistSeriesIds.includes(series.seriesId)}
                isWatchlistPending={watchlistUpdatingId === series.seriesId}
                onToggleWatchlist={handleToggleWatchlist}
              />
              {reserving === series.seriesId && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/70">
                  <div className="ui-spinner h-8 w-8 animate-spin rounded-full border-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="ui-panel-muted rounded-xl p-8 text-center">
          <p className="text-content-muted">現在取扱中のくじはありません</p>
        </div>
      )}

      {reserveTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserveModalTitle"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2
              id="reserveModalTitle"
              className="text-center text-xl font-bold text-content-strong sm:text-2xl"
            >
              購入権利を予約
            </h2>

            <div className="mt-4 space-y-1 text-sm leading-6 text-content">
              <p>商品名：{reserveTarget.title}</p>
              <p>価格：{reserveTarget.price}円</p>
              <p>最大3枚まで予約可能</p>
            </div>

            <div className="mt-5 flex justify-center">
              <label htmlFor="reserveQuantity" className="sr-only">
                予約枚数
              </label>

              <div className="flex w-fit items-center rounded-lg border border-border bg-background">
                <button
                  type="button"
                  onClick={() => updateDrawCount(drawCount - 1)}
                  disabled={drawCount <= 1 || !!reserving}
                  className="flex h-10 w-9 items-center justify-center text-lg leading-none text-content-muted transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  -
                </button>

                <input
                  type="number"
                  id="reserveQuantity"
                  min={1}
                  max={3}
                  inputMode="numeric"
                  value={drawCount}
                  onChange={(event) => updateDrawCount(Number(event.target.value) || 1)}
                  className="h-10 w-12 border-transparent bg-transparent text-center text-content-strong [-moz-appearance:textfield] focus:outline-none sm:text-sm [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                />

                <button
                  type="button"
                  onClick={() => updateDrawCount(drawCount + 1)}
                  disabled={drawCount >= 3 || !!reserving}
                  className="flex h-10 w-9 items-center justify-center text-lg leading-none text-content-muted transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  +
                </button>
              </div>
            </div>

            <footer className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setReserveTarget(null)}
                disabled={!!reserving}
                className="rounded-lg bg-background px-4 py-2 text-sm font-medium text-content-muted transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleConfirmReserve}
                disabled={!!reserving}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reserving ? '予約中...' : '予約する'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
          <p className="text-sm text-content-muted">読み込み中...</p>
        </div>
      }
    >
      <StoreDetailContent />
    </Suspense>
  );
}
