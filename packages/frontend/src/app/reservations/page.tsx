'use client';

import { useState, useEffect } from 'react';
import { getReservations, cancelReservation, type Reservation } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          申込中
        </span>
      );
    case 'won':
      return (
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          当選
        </span>
      );
    case 'lost':
      return (
        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          落選
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
          キャンセル済
        </span>
      );
    default:
      return null;
  }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/login/';
      return;
    }

    async function fetchReservations() {
      try {
        const data = await getReservations();
        setReservations(data);
      } catch {
        setError('予約情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, []);

  const handleCancel = async (storeId: string, seriesId: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return;
    try {
      await cancelReservation(storeId, seriesId);
      setReservations((prev) =>
        prev.map((r) =>
          r.store_id === storeId && r.series_id === seriesId
            ? { ...r, status: 'cancelled' as const }
            : r
        )
      );
    } catch {
      alert('キャンセルに失敗しました。');
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
        <h1 className="text-2xl font-bold text-gray-900">予約一覧</h1>
        <p className="mt-1 text-sm text-gray-500">あなたの予約状況を確認できます</p>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-lg font-medium text-gray-700">予約はありません</p>
          <p className="mt-1 text-sm text-gray-500">
            店舗ページからくじを予約してください
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.reservation_id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {r.series_title}
                </h3>
                {statusLabel(r.status)}
              </div>
              <p className="text-sm text-gray-500">{r.store_name}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  <span>引く回数: {r.draw_count}回</span>
                  <span className="ml-3">
                    {new Date(r.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(r.store_id, r.series_id)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
