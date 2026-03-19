'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isMyStore, addMyStore, removeMyStore } from '@/lib/myStores';

export interface MapStore {
  store_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  matchedPrizes: string[];
  remainingTickets: number;
}

interface StoreMapProps {
  stores: MapStore[];
  center: { lat: number; lng: number };
}

export default function StoreMap({ stores, center }: StoreMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // マップ初期化
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([center.lat, center.lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // ズームコントロールを右下に
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // マーカー更新
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (stores.length === 0) return;

    stores.forEach((store) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="store-map-marker">${store.remainingTickets}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([store.lat, store.lng], { icon });

      const prizesHtml = store.matchedPrizes
        .map((p) => `<span class="store-map-prize">${p}</span>`)
        .join('');

      const isMy = isMyStore(store.store_id);
      const btnLabel = isMy ? 'マイ店舗から解除' : 'マイ店舗に追加';
      const btnClass = isMy
        ? 'my-store-btn store-map-button store-map-button--remove'
        : 'my-store-btn store-map-button store-map-button--add';

      const popup = L.popup({ closeButton: false }).setContent(
        `<div class="store-map-popup">
          <div class="store-map-name">${store.name}</div>
          <div class="store-map-address">${store.address}</div>
          <div class="store-map-remaining">残り ${store.remainingTickets} 枚</div>
          <div class="store-map-prizes">${prizesHtml}</div>
          <button
            data-store-id="${store.store_id}"
            data-action="${isMy ? 'remove' : 'add'}"
            class="${btnClass}"
          >${btnLabel}</button>
        </div>`,
      );

      marker.bindPopup(popup);

      markersRef.current!.addLayer(marker);
    });

    // マイ店舗ボタンのクリックハンドラ
    const container = mapRef.current.getContainer();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('my-store-btn')) return;
      const storeId = target.getAttribute('data-store-id');
      const action = target.getAttribute('data-action');
      if (!storeId) return;

      if (action === 'add') {
        addMyStore(storeId);
        target.textContent = 'マイ店舗から解除';
        target.setAttribute('data-action', 'remove');
        target.className = 'my-store-btn store-map-button store-map-button--remove';
      } else {
        removeMyStore(storeId);
        target.textContent = 'マイ店舗に追加';
        target.setAttribute('data-action', 'add');
        target.className = 'my-store-btn store-map-button store-map-button--add';
      }
    };
    container.addEventListener('click', handleClick);

    // 全マーカーが収まるようにフィット
    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [stores]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}
