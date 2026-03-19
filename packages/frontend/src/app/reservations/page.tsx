'use client';

import { useState, useEffect } from 'react';
import { getReservations, cancelReservation, type Reservation } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

function statusLabel(status: string) {
  switch (status) {
    case 'pending':
      return (
        <span className="ui-badge ui-badge-warning px-2.5 py-0.5 text-xs">
          申込中
        </span>
      );
    case 'won':
      return (
        <span className="ui-badge ui-badge-success px-2.5 py-0.5 text-xs">
          当選
        </span>
      );
    case 'lost':
      return (
        <span className="ui-badge ui-badge-neutral px-2.5 py-0.5 text-xs">
          落選
        </span>
      );
    case 'cancelled':
      return (
        <span className="ui-badge ui-badge-danger px-2.5 py-0.5 text-xs">
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
          r.storeId === storeId && r.seriesId === seriesId
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
        <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
        <p className="text-sm text-content-muted">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-panel-danger rounded-xl p-6 text-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-strong">予約一覧</h1>
        <p className="mt-1 text-sm text-content-muted">あなたの予約状況を確認できます</p>
      </div>

      {reservations.length === 0 ? (
        <div className="ui-panel-muted rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-content">予約はありません</p>
          <p className="mt-1 text-sm text-content-muted">
            店舗ページからくじを予約してください
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.reservationId}
              className="ui-card rounded-xl p-4 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-content-strong truncate">
                  {r.seriesTitle}
                </h3>
                {statusLabel(r.status)}
              </div>
              <p className="text-sm text-content-muted">{r.storeName}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="text-content-muted">
                  <span>引く回数: {r.drawCount}回</span>
                  <span className="ml-3">
                    {new Date(r.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(r.storeId, r.seriesId)}
                    className="ui-button-danger rounded-lg px-3 py-1 text-xs font-medium transition-colors"
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
