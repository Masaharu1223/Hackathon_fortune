'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStoreBrandImagePath, type StoreBrand } from '@/lib/storeBrand';

export interface MapStore {
  storeId: string;
  storeName: string;
  storeBrand: StoreBrand;
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
  const currentLocMarkerRef = useRef<L.Marker | null>(null);
  const initialCenterRef = useRef(center);

  // マップ初期化
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([initialCenterRef.current.lat, initialCenterRef.current.lng], 14);

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
  }, []);

  // マーカー更新
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (stores.length === 0) return;

    stores.forEach((store) => {
      const logoPath = getStoreBrandImagePath(store.storeBrand);
      const icon = L.divIcon({
        className: 'store-map-marker-icon',
        html: `
          <div class="store-map-marker">
            <img
              src="${logoPath}"
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

    // 現在地マーカー
    if (currentLocMarkerRef.current) {
      currentLocMarkerRef.current.remove();
    }
    const currentLocIcon = L.divIcon({
      className: 'current-location-icon',
      html: `<div style="
        width: 16px; height: 16px;
        background: #4285F4;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(66,133,244,0.5);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    currentLocMarkerRef.current = L.marker([center.lat, center.lng], {
      icon: currentLocIcon,
      zIndexOffset: 1000,
    })
      .bindTooltip('現在地', { direction: 'top', offset: [0, -10] })
      .addTo(mapRef.current);

    // 全マーカーが収まるようにフィット（現在地も含む）
    const allPoints: [number, number][] = stores.map((s) => [s.lat, s.lng]);
    allPoints.push([center.lat, center.lng]);
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return undefined;
  }, [stores, center.lat, center.lng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}
