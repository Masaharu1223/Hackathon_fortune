'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapStore {
  storeId: string;
  storeName: string;
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
        className: 'store-map-marker-icon',
        html: `
          <div class="store-map-marker">
            <img
              src="/shop_logo.png"
              alt=""
              class="store-map-marker-image"
            />
            <span class="store-map-marker-badge">${store.remainingTickets}</span>
          </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([store.lat, store.lng], { icon });

      const prizesHtml = store.matchedPrizes
        .map((p) => `<span class="store-map-prize">${p}</span>`)
        .join('');

      const popup = L.popup({ closeButton: false }).setContent(
        `<div class="store-map-popup">
          <div class="store-map-name">${store.storeName}</div>
          <div class="store-map-address">${store.address}</div>
          <div class="store-map-remaining">残り ${store.remainingTickets} 枚</div>
          <div class="store-map-prizes">${prizesHtml}</div>
          <div class="store-map-actions">
            <a
              href="/stores/detail/?id=${store.storeId}"
              class="store-map-button store-map-button--detail"
            >店舗の詳細</a>
          </div>
        </div>`,
      );

      marker.bindPopup(popup);

      markersRef.current!.addLayer(marker);
    });

    // 全マーカーが収まるようにフィット
    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return undefined;
  }, [stores]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}
