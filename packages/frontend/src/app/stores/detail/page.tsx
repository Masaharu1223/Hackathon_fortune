'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getStore, createReservation, type Store } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import KujiCard from '@/components/KujiCard';

function StoreDetailContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('id') || '';
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;

    async function fetchStore() {
      try {
        const data = await getStore(storeId);
        setStore(data);
      } catch {
        setError('店舗情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    }
    fetchStore();
  }, [storeId]);

  const handleReserve = async (seriesId: string) => {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return;
    }

    const drawCount = parseInt(
      prompt('引く回数を入力してください（1〜3）:') || '0',
      10,
    );
    if (!drawCount || drawCount < 1 || drawCount > 3) return;

    setReserving(seriesId);
    try {
      await createReservation(storeId, seriesId, drawCount);
      alert('予約が完了しました！');
      const data = await getStore(storeId);
      setStore(data);
    } catch {
      alert('予約に失敗しました。もう一度お試しください。');
    } finally {
      setReserving(null);
    }
  };

  if (!storeId) {
    return (
      <div className="rounded-xl bg-yellow-50 p-6 text-center">
        <p className="text-sm text-yellow-600">店舗IDが指定されていません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error || '店舗が見つかりません'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{store.address}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">取扱くじ一覧</h2>
      </div>

      {store.series && store.series.length > 0 ? (
        <div className="space-y-4">
          {store.series.map((series) => (
            <div key={series.series_id} className="relative">
              <KujiCard series={series} storeId={store.store_id} onReserve={handleReserve} />
              {reserving === series.series_id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-gray-500">現在取扱中のくじはありません</p>
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
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      }
    >
      <StoreDetailContent />
    </Suspense>
  );
}
