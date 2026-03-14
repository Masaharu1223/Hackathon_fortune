'use client';

import { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return;
    }

    async function fetchWatchlist() {
      try {
        const data = await getWatchlist();
        setItems(data);
      } catch {
        setError('ウォッチリストの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    }
    fetchWatchlist();
  }, []);

  const handleRemove = async (seriesId: string) => {
    if (!confirm('ウォッチリストから削除しますか？')) return;
    try {
      await removeFromWatchlist(seriesId);
      setItems((prev) => prev.filter((item) => item.series_id !== seriesId));
    } catch {
      alert('削除に失敗しました。');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ウォッチリスト</h1>
        <p className="mt-1 text-sm text-gray-500">
          気になるくじシリーズを管理できます
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-lg font-medium text-gray-700">
            ウォッチリストは空です
          </p>
          <p className="mt-1 text-sm text-gray-500">
            店舗ページからくじシリーズを追加してください
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.series_id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    発売日: {new Date(item.release_date).toLocaleDateString('ja-JP')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                      通知範囲: {item.notification_radius_km}km
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.series_id)}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
