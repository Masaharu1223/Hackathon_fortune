'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Prize {
  rank: string;
  name: string;
  quantity: number;
  remaining?: number;
}

interface KujiSeries {
  seriesId: string;
  title: string;
  price: number;
  releaseDate: string;
  totalTickets: number;
  remainingTickets: number;
  status: string;
  prizes: Prize[];
}

interface RawStore {
  storeId: string;
  storeName: string;
  managerId: string;
  kujiSeries?: KujiSeries[];
}

// ---------------------------------------------------------------------------
// Grade detection
// ---------------------------------------------------------------------------

// Cyrillic / lookalike → ASCII normalization
const LOOKALIKE_MAP: Record<string, string> = {
  'А': 'A', 'В': 'B', 'С': 'C', 'Д': 'D', 'Е': 'E', 'Н': 'H',
  'а': 'A', 'в': 'B', 'с': 'C', 'е': 'E',
  'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E',
};

function normalize(text: string): string {
  return text.split('').map((c) => LOOKALIKE_MAP[c] ?? c).join('');
}

function detectGrade(texts: string[], prizes: Prize[]): string | null {
  const normalizedTexts = texts.map(normalize);
  const combined = normalizedTexts.join(' ');
  const ranks = prizes.map((p) => p.rank);

  // Priority 1: "A賞" or "A 賞" pattern in combined text
  for (const rank of ranks) {
    if (combined.includes(`${rank}賞`) || combined.includes(`${rank} 賞`)) {
      return rank;
    }
  }

  // Priority 2: exact single rank letter detected as a LINE (after normalization)
  for (const text of normalizedTexts) {
    const trimmed = text.trim();
    if (ranks.includes(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export default function KujiInventoryClient({
  storeId,
  seriesId,
}: {
  storeId: string;
  seriesId: string;
}) {
  const [store, setStore] = useState<RawStore | null>(null);
  const [series, setSeries] = useState<KujiSeries | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [managerId, setManagerId] = useState<string>('admin-001');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Camera / recognition states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [detectedGrade, setDetectedGrade] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch store + series
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/stores/${storeId}`, {
        headers: { 'x-dev-user-id': 'dev-user-001' },
      });
      if (!res.ok) throw new Error(`Store fetch failed: ${res.status}`);
      const json = await res.json() as { success: boolean; data: RawStore };
      if (!json.success) throw new Error('Store not found');

      const rawStore = json.data;
      setStore(rawStore);
      setManagerId(rawStore.managerId ?? 'admin-001');

      const found = (rawStore.kujiSeries ?? []).find((s) => s.seriesId === seriesId);
      if (!found) throw new Error('くじシリーズが見つかりません');

      setSeries(found);
      // Initialize prize remaining counts (fallback to quantity if remaining is missing)
      setPrizes(
        found.prizes.map((p) => ({
          ...p,
          remaining: p.remaining ?? p.quantity,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [storeId, seriesId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------------------------------------------------------------------------
  // Inventory update
  // ---------------------------------------------------------------------------

  const applyGrade = async (rank: string) => {
    if (!series) return;

    const prizeIndex = prizes.findIndex((p) => p.rank === rank);
    if (prizeIndex === -1) {
      setToast({ type: 'error', text: `${rank}賞 は賞品リストに存在しません` });
      return;
    }

    const prize = prizes[prizeIndex];
    if ((prize.remaining ?? 0) <= 0) {
      setToast({ type: 'error', text: `${rank}賞 の在庫がありません` });
      return;
    }

    setUpdating(true);
    try {
      const newPrizes = prizes.map((p, i) =>
        i === prizeIndex ? { ...p, remaining: (p.remaining ?? 1) - 1 } : p,
      );
      const newRemaining = series.remainingTickets - 1;

      const res = await fetch(`${BASE_URL}/admin/stores/${storeId}/kuji/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': managerId,
        },
        body: JSON.stringify({
          remainingTickets: newRemaining,
          prizes: newPrizes,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Update failed: ${res.status} ${body}`);
      }

      // Apply locally
      setPrizes(newPrizes);
      setSeries((prev) => prev ? { ...prev, remainingTickets: newRemaining } : prev);
      setToast({ type: 'success', text: `${rank}賞 を消費しました。残り ${newRemaining} 枚` });
    } catch (err) {
      setToast({
        type: 'error',
        text: err instanceof Error ? err.message : '在庫更新に失敗しました',
      });
    } finally {
      setUpdating(false);
      setDetectedGrade(null);
      setShowManual(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Camera capture & Rekognition
  // ---------------------------------------------------------------------------

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRecognizing(true);
    setDetectedGrade(null);
    setShowManual(false);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/rekognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? '認識APIエラー');
      }

      const { texts } = await res.json() as { texts: string[] };
      const grade = detectGrade(texts, prizes);

      if (grade) {
        setDetectedGrade(grade);
      } else {
        setShowManual(true);
      }
    } catch (err) {
      console.error('Rekognition error:', err);
      setShowManual(true);
    } finally {
      setRecognizing(false);
      // Reset file input so the same image can be re-captured
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        <p className="text-sm text-danger">{error ?? 'データが見つかりません'}</p>
      </div>
    );
  }

  const isSoldOut = series.remainingTickets <= 0;

  return (
    <div className="pb-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header info */}
      <div className="mb-4">
        <p className="text-xs text-content-subtle">{store?.storeName}</p>
        <h1 className="mt-0.5 text-xl font-bold leading-7 text-content-strong">{series.title}</h1>
      </div>

      {/* Remaining tickets summary */}
      <div
        className={`mb-5 rounded-2xl p-4 text-center ${
          isSoldOut ? 'bg-danger-soft' : series.remainingTickets <= 5 ? 'bg-warning-soft' : 'bg-brand-soft'
        }`}
      >
        <p className="text-xs font-medium text-content-subtle">残り枚数</p>
        <p
          className={`text-4xl font-bold tabular-nums ${
            isSoldOut ? 'text-danger' : series.remainingTickets <= 5 ? 'text-warning' : 'text-brand'
          }`}
        >
          {series.remainingTickets}
        </p>
        <p className="text-xs text-content-muted">/ {series.totalTickets} 枚</p>
      </div>

      {/* Prize inventory list */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-content-strong">賞品在庫</h2>
        <div className="space-y-2">
          {prizes.map((prize) => {
            const remaining = prize.remaining ?? 0;
            const isEmpty = remaining <= 0;
            return (
              <div
                key={prize.rank}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  isEmpty ? 'bg-surface opacity-50' : 'ui-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isEmpty ? 'bg-border text-content-subtle' : 'bg-brand text-on-brand'
                    }`}
                  >
                    {prize.rank}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-content-strong">{prize.name}</p>
                    <p className="text-xs text-content-subtle">{prize.rank}賞</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isEmpty ? 'text-content-subtle' : remaining <= 2 ? 'text-danger' : 'text-content-strong'
                    }`}
                  >
                    {remaining}
                  </p>
                  <p className="text-xs text-content-subtle">/ {prize.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Camera button */}
      {!isSoldOut && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={recognizing || updating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-4 text-base font-semibold text-on-brand shadow-sm transition-colors hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recognizing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-brand/40 border-t-on-brand" />
                認識中...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
                くじを撮影する
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setShowManual(true); setDetectedGrade(null); }}
            disabled={recognizing || updating}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-content-muted transition-colors hover:bg-brand-soft hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            手動で等級を選択
          </button>
        </div>
      )}

      {isSoldOut && (
        <div className="rounded-xl bg-danger-soft p-4 text-center text-sm font-medium text-danger">
          このシリーズは完売済みです
        </div>
      )}

      {/* Grade confirmation dialog */}
      {detectedGrade && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft mx-auto">
              <span className="text-2xl font-bold text-brand">{detectedGrade}</span>
            </div>
            <h2 className="text-center text-xl font-bold text-content-strong">
              {detectedGrade}賞 が出ました！
            </h2>
            <p className="mt-2 text-center text-sm text-content-muted">
              在庫を 1 枚減らしますか？
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDetectedGrade(null)}
                disabled={updating}
                className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-medium text-content-muted transition-colors hover:bg-brand-soft disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => applyGrade(detectedGrade)}
                disabled={updating}
                className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {updating ? '更新中...' : '確認して更新'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setDetectedGrade(null); setShowManual(true); }}
              disabled={updating}
              className="mt-3 w-full text-center text-xs text-content-subtle underline"
            >
              等級が違う場合はこちら
            </button>
          </div>
        </div>
      )}

      {/* Manual grade selection */}
      {showManual && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="mb-1 text-center text-lg font-bold text-content-strong">
              等級を手動で選択
            </h2>
            <p className="mb-4 text-center text-xs text-content-muted">
              出たくじの等級をタップしてください
            </p>
            <div className="grid grid-cols-3 gap-2">
              {prizes.map((prize) => {
                const remaining = prize.remaining ?? 0;
                const isEmpty = remaining <= 0;
                return (
                  <button
                    key={prize.rank}
                    type="button"
                    disabled={isEmpty || updating}
                    onClick={() => applyGrade(prize.rank)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-4 transition-colors ${
                      isEmpty
                        ? 'border-border bg-surface opacity-40 cursor-not-allowed'
                        : 'border-brand-border bg-brand-soft text-brand hover:bg-brand hover:text-on-brand active:scale-95'
                    }`}
                  >
                    <span className="text-xl font-bold">{prize.rank}</span>
                    <span className="text-xs">残{remaining}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowManual(false)}
              disabled={updating}
              className="mt-4 w-full rounded-xl border border-border py-3 text-sm text-content-muted transition-colors hover:bg-brand-soft"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
