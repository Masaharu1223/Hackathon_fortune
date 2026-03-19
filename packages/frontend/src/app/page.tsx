'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MOCK_STORES } from '@/lib/mockData';
import type { MapStore } from '@/components/StoreMap';

// Leafletはwindow依存なので動的インポート
const StoreMap = dynamic(() => import('@/components/StoreMap'), { ssr: false });

// 全景品名を抽出（検索候補用）
function getAllPrizeNames(): string[] {
  const names = new Set<string>();
  MOCK_STORES.forEach((store) =>
    store.series.forEach((s) =>
      s.prizes.forEach((p) => {
        names.add(p.name);
        names.add(s.title);
      }),
    ),
  );
  return Array.from(names);
}

function searchStores(query: string): MapStore[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase();
  const results: MapStore[] = [];

  MOCK_STORES.forEach((store) => {
    const matchedPrizes: string[] = [];
    let totalRemaining = 0;

    store.series.forEach((series) => {
      if (series.status === 'sold_out') return;

      // くじタイトルまたは景品名にマッチ
      const titleMatch = series.title.toLowerCase().includes(q);
      series.prizes.forEach((prize) => {
        if (titleMatch || prize.name.toLowerCase().includes(q)) {
          if (prize.remaining > 0) {
            matchedPrizes.push(`${prize.rank}賞 ${prize.name}`);
            totalRemaining += prize.remaining;
          }
        }
      });
    });

    if (matchedPrizes.length > 0) {
      results.push({
        store_id: store.store_id,
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        matchedPrizes,
        remainingTickets: totalRemaining,
      });
    }
  });

  return results;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [center, setCenter] = useState({ lat: 35.6595, lng: 139.7004 }); // 渋谷デフォルト

  const allPrizes = useMemo(() => getAllPrizeNames(), []);

  // 位置情報取得
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 },
    );
  }, []);

  // デバウンス
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => searchStores(debouncedQuery), [debouncedQuery]);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 1) return [];
    const q = query.toLowerCase();
    return allPrizes.filter((n) => n.toLowerCase().includes(q)).slice(0, 6);
  }, [query, allPrizes]);

  const handleSelect = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(false);
  }, []);

  return (
    <div className="flex flex-col pb-20" style={{ height: 'calc(100dvh - 52px - 60px)' }}>
      {/* 検索バー */}
      <div className="relative mb-3 shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-content-subtle"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="景品名・くじタイトルで検索..."
            className="ui-input w-full rounded-xl py-3 pl-11 pr-10 text-sm shadow-sm"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setShowSuggestions(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-content-subtle hover:text-content"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* サジェスト */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-content transition-colors hover:bg-brand-soft"
              >
                <svg className="h-4 w-4 shrink-0 text-content-subtle" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 結果サマリー */}
      {debouncedQuery && (
        <div className="mb-2 shrink-0 flex items-center gap-2 text-sm">
          <span className="text-content-muted">
            {results.length > 0
              ? `${results.length}店舗で在庫あり`
              : '在庫が見つかりませんでした'}
          </span>
          {results.length > 0 && (
            <span className="ui-badge ui-badge-brand px-2 py-0.5 text-xs">
              残り合計 {results.reduce((n, s) => n + s.remainingTickets, 0)} 個
            </span>
          )}
        </div>
      )}

      {/* 地図 */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border shadow-sm">
        {!debouncedQuery ? (
          <div className="flex h-full flex-col items-center justify-center bg-brand-soft p-8 text-center">
            <div className="mb-4 rounded-2xl bg-brand-soft p-4">
              <svg className="h-10 w-10 text-brand" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="font-medium text-content">景品を検索してみよう</p>
            <p className="mt-1 text-sm text-content-subtle">
              欲しい景品の名前やくじのタイトルを入力すると<br />在庫のある店舗が地図に表示されます
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['フィギュア', 'ドラゴンボール', 'ワンピース', 'アーニャ'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); setShowSuggestions(false); }}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-content transition-colors hover:border-brand-border hover:text-brand"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <StoreMap stores={results} center={center} />
        )}
      </div>
    </div>
  );
}
