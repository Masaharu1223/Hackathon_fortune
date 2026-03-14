'use client';

import { useState } from 'react';
import { isLoggedIn } from '@/lib/auth';

interface StoreForm {
  name: string;
  address: string;
  lat: string;
  lng: string;
}

interface SeriesForm {
  store_id: string;
  title: string;
  release_date: string;
  total_tickets: string;
  prizes: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

async function adminRequest(path: string, body: unknown) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
}

export default function AdminPage() {
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
    release_date: '',
    total_tickets: '',
    prizes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (typeof window !== 'undefined' && !isLoggedIn()) {
    window.location.href = '/login/';
    return null;
  }

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await adminRequest('/admin/stores', {
        name: storeForm.name,
        address: storeForm.address,
        lat: parseFloat(storeForm.lat),
        lng: parseFloat(storeForm.lng),
      });
      setMessage({ type: 'success', text: '店舗を登録しました' });
      setStoreForm({ name: '', address: '', lat: '', lng: '' });
    } catch {
      setMessage({ type: 'error', text: '店舗の登録に失敗しました' });
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
      await adminRequest('/admin/series', {
        store_id: seriesForm.store_id,
        title: seriesForm.title,
        release_date: seriesForm.release_date,
        total_tickets: parseInt(seriesForm.total_tickets, 10),
        prizes,
      });
      setMessage({ type: 'success', text: 'くじシリーズを登録しました' });
      setSeriesForm({ store_id: '', title: '', release_date: '', total_tickets: '', prizes: '' });
    } catch {
      setMessage({ type: 'error', text: 'くじシリーズの登録に失敗しました' });
    }
  };

  const tabs = [
    { key: 'store' as const, label: '店舗登録' },
    { key: 'series' as const, label: 'くじ登録' },
    { key: 'reservations' as const, label: '予約管理' },
  ];

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
        <p className="mt-1 text-sm text-gray-500">店舗やくじシリーズを管理します</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMessage(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700"
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700"
          >
            くじシリーズを登録
          </button>
        </form>
      )}

      {activeTab === 'reservations' && (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            予約管理機能は今後実装予定です
          </p>
        </div>
      )}
    </div>
  );
}
