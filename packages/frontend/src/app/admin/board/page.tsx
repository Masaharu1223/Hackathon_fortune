'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStore, updateKujiSeriesTickets, type KujiSeries } from '@/lib/api';
import type { BoardScanResult } from '@/app/api/board-scan/route';

interface DetectedPrize {
  rank: string;
  count: number;
}

function BoardContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId') ?? '';
  const seriesId = searchParams.get('seriesId') ?? '';
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevResultRef = useRef<DetectedPrize[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [series, setSeries] = useState<KujiSeries | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [detectedPrizes, setDetectedPrizes] = useState<DetectedPrize[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [remainingTickets, setRemainingTickets] = useState<number | null>(null);

  useEffect(() => {
    if (!storeId || !seriesId) return;
    async function fetchSeries() {
      try {
        const store = await getStore(storeId);
        const found = store.series.find((s) => s.seriesId === seriesId) ?? null;
        setSeries(found);
        if (found) setRemainingTickets(found.remainingTickets);
      } catch {
        setLoadError('くじシリーズの取得に失敗しました');
      }
    }
    fetchSeries();
  }, [storeId, seriesId]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCameraError('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !series) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.95);

    setScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/board-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const result: BoardScanResult = await res.json();

      if (!result.success) {
        setScanError(result.error ?? '読み取りに失敗しました');
        return;
      }

      setDetectedPrizes(result.prizes);
      setLastUpdated(new Date());

      const prev = prevResultRef.current;
      const hasChanged =
        result.prizes.length !== prev.length ||
        result.prizes.some((p) => p.count !== prev.find((r) => r.rank === p.rank)?.count);

      if (hasChanged) {
        prevResultRef.current = result.prizes;
        const clamped = Math.max(0, (series.totalTickets ?? 0) - result.totalDetected);
        try {
          await updateKujiSeriesTickets(storeId, seriesId, clamped);
          setRemainingTickets(clamped);
        } catch {
          setScanError('在庫の更新に失敗しました（認識結果は維持されます）');
        }
      }
    } catch {
      setScanError('読み取りに失敗しました（前回の結果を維持します）');
    } finally {
      setScanning(false);
    }
  }, [series, storeId, seriesId]);

  useEffect(() => {
    if (!series) return;
    const interval = setInterval(captureAndScan, 5000);
    return () => clearInterval(interval);
  }, [series, captureAndScan]);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-content-muted hover:bg-brand-soft hover:text-brand"
          aria-label="戻る"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-content-strong">ボード読み取りモード</h1>
          {series && <p className="truncate text-xs text-content-muted">{series.title}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {scanning && <div className="ui-spinner h-4 w-4 animate-spin rounded-full border-2" />}
          <span className={`text-xs font-medium ${scanning ? 'text-brand' : 'text-content-muted'}`}>
            {scanning ? '読み取り中...' : formattedTime ? `更新 ${formattedTime}` : '待機中'}
          </span>
        </div>
      </div>

      {loadError && (
        <div className="mx-4 mt-3 rounded-lg p-3 text-sm ui-panel-danger text-danger">{loadError}</div>
      )}

      {/* Camera — full width */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-danger">{cameraError}</p>
            <p className="mt-2 text-xs text-content-muted">HTTPS または localhost 環境でのみ動作します</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay: scan status */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1">
          {scanning
            ? <><div className="ui-spinner h-3 w-3 animate-spin rounded-full border-2" /><span className="text-xs text-white">読み取り中...</span></>
            : <span className="text-xs text-white/70">{formattedTime ? `最終更新 ${formattedTime}` : '5秒ごとに自動撮影'}</span>
          }
        </div>
      </div>

      {/* Inventory panel */}
      <div className="p-4 space-y-3">
        {/* Overall remaining */}
        <div className="flex items-center justify-between rounded-xl bg-brand-soft px-5 py-3">
          <span className="text-sm font-medium text-content">全体の残り枚数</span>
          <span className="text-2xl font-bold text-brand">
            {remainingTickets !== null ? remainingTickets : '—'}
            <span className="ml-1 text-sm font-normal text-content-muted">/ {series?.totalTickets ?? '—'} 枚</span>
          </span>
        </div>

        {/* Per-prize grid */}
        {series && series.prizes.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {series.prizes.map((prize) => {
              const used = detectedPrizes.find((p) => p.rank === prize.rank)?.count ?? 0;
              const remaining = Math.max(0, prize.quantity - used);
              const isEmpty = remaining === 0;
              return (
                <div
                  key={prize.rank}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                    isEmpty ? 'border-border bg-background opacity-50' : 'border-border bg-surface'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-brand">{prize.rank}賞</span>
                    <p className="truncate text-xs text-content-muted">{prize.name}</p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <span className="text-lg font-bold text-content-strong">{remaining}</span>
                    <span className="text-xs text-content-muted">/{prize.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Last scan result */}
        {detectedPrizes.length > 0 && (
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="mb-1.5 text-xs font-medium text-content-muted">検出された半券</p>
            <div className="flex flex-wrap gap-2">
              {detectedPrizes.map((p) => (
                <span key={p.rank} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  {p.rank}賞 × {p.count}
                </span>
              ))}
            </div>
          </div>
        )}

        {scanError && (
          <div className="rounded-lg p-3 text-xs ui-panel-danger text-danger">{scanError}</div>
        )}

        <p className="text-center text-xs text-content-muted">5秒ごとに自動でボードを撮影します</p>
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
          <p className="text-sm text-content-muted">読み込み中...</p>
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  );
}
