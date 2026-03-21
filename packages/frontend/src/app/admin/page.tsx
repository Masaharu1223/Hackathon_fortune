'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders, isLoggedIn } from '@/lib/auth';

interface StoreForm {
  name: string;
  address: string;
  lat: string;
  lng: string;
}

interface SeriesForm {
  store_id: string;
  title: string;
  price: string;
  release_date: string;
  total_tickets: string;
  prizes: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

async function adminRequest(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Error: ${res.status}`);
  }

  return res.json();
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'store' | 'series' | 'reservations'>('store');
  const [storeForm, setStoreForm] = useState<StoreForm>({
    name: '',
    address: '',
    lat: '',
    lng: '',
  });
  const [seriesForm, setSeriesForm] = useState<SeriesForm>({
    store_id: '',
    title: '',
    price: '',
    release_date: '',
    total_tickets: '',
    prizes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const loggedIn = typeof window === 'undefined' ? true : isLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      router.replace('/login/');
    }
  }, [loggedIn, router]);

  if (!loggedIn) return null;

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await adminRequest('/admin/stores', {
        storeName: storeForm.name,
        address: storeForm.address,
        lat: parseFloat(storeForm.lat),
        lng: parseFloat(storeForm.lng),
      });
      setMessage({ type: 'success', text: '店舗を登録しました' });
      setStoreForm({ name: '', address: '', lat: '', lng: '' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '店舗の登録に失敗しました',
      });
    }
  };

  const handleSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      let prizes = [];
      try {
        prizes = JSON.parse(seriesForm.prizes || '[]');
      } catch {
        setMessage({ type: 'error', text: '賞品のJSON形式が正しくありません' });
        return;
      }
      await adminRequest(`/admin/stores/${seriesForm.store_id}/kuji`, {
        title: seriesForm.title,
        price: parseInt(seriesForm.price, 10),
        releaseDate: seriesForm.release_date,
        totalTickets: parseInt(seriesForm.total_tickets, 10),
        prizes,
      });
      setMessage({ type: 'success', text: 'くじシリーズを登録しました' });
      setSeriesForm({ store_id: '', title: '', price: '', release_date: '', total_tickets: '', prizes: '' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'くじシリーズの登録に失敗しました',
      });
    }
  };

  const tabs = [
    { key: 'store' as const, label: '店舗登録' },
    { key: 'series' as const, label: 'くじ登録' },
    { key: 'reservations' as const, label: '予約管理' },
  ];

  const inputClass =
    'ui-input w-full rounded-lg px-3 py-2.5 text-sm transition-colors';
  const labelClass = 'mb-1 block text-sm font-medium text-content';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-strong">管理画面</h1>
        <p className="mt-1 text-sm text-content-muted">店舗やくじシリーズを管理します</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-brand-soft p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMessage(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-surface text-brand shadow-sm'
                : 'text-content-muted hover:text-content'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 text-sm ${
            message.type === 'success'
              ? 'bg-success-soft text-success'
              : 'ui-panel-danger text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>店舗名</label>
            <input
              type="text"
              className={inputClass}
              placeholder="例: セブンイレブン 渋谷店"
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelClass}>住所</label>
            <input
              type="text"
              className={inputClass}
              placeholder="例: 東京都渋谷区..."
              value={storeForm.address}
              onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>緯度</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="35.6580"
                value={storeForm.lat}
                onChange={(e) => setStoreForm({ ...storeForm, lat: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>経度</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="139.7016"
                value={storeForm.lng}
                onChange={(e) => setStoreForm({ ...storeForm, lng: e.target.value })}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="ui-button-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            店舗を登録
          </button>
        </form>
      )}

      {activeTab === 'series' && (
        <form onSubmit={handleSeriesSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>店舗ID</label>
            <input
              type="text"
              className={inputClass}
              placeholder="store_xxxx"
              value={seriesForm.store_id}
              onChange={(e) => setSeriesForm({ ...seriesForm, store_id: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelClass}>くじタイトル</label>
            <input
              type="text"
              className={inputClass}
              placeholder="例: ワンピース一番くじ"
              value={seriesForm.title}
              onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>価格</label>
              <input
                type="number"
                className={inputClass}
                placeholder="790"
                value={seriesForm.price}
                onChange={(e) => setSeriesForm({ ...seriesForm, price: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>発売日</label>
              <input
                type="date"
                className={inputClass}
                value={seriesForm.release_date}
                onChange={(e) => setSeriesForm({ ...seriesForm, release_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>総枚数</label>
              <input
                type="number"
                className={inputClass}
                placeholder="80"
                value={seriesForm.total_tickets}
                onChange={(e) => setSeriesForm({ ...seriesForm, total_tickets: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>賞品 (JSON)</label>
            <textarea
              className={`${inputClass} h-28 resize-none font-mono text-xs`}
              placeholder={'[\n  {"rank": "A", "name": "フィギュア", "quantity": 2},\n  {"rank": "B", "name": "タオル", "quantity": 3}\n]'}
              value={seriesForm.prizes}
              onChange={(e) => setSeriesForm({ ...seriesForm, prizes: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="ui-button-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            くじシリーズを登録
          </button>
        </form>
      )}

      {activeTab === 'reservations' && (
        <div className="ui-panel-muted rounded-xl p-8 text-center">
          <p className="text-content-muted">
            予約管理機能は今後実装予定です
          </p>
        </div>
      )}
    </div>
  );
}
