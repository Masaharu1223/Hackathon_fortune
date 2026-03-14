'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
        html: `<div style="
          background: #4f46e5;
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(79,70,229,0.4);
          border: 2px solid white;
        ">${store.remainingTickets}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([store.lat, store.lng], { icon });

      const prizesHtml = store.matchedPrizes
        .map((p) => `<span style="display:inline-block;background:#eef2ff;color:#4338ca;border-radius:4px;padding:2px 6px;margin:2px;font-size:11px;">${p}</span>`)
        .join('');

      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${store.name}</div>
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px;">${store.address}</div>
          <div style="font-size:12px;color:#4f46e5;font-weight:600;margin-bottom:4px;">残り ${store.remainingTickets} 枚</div>
          <div>${prizesHtml}</div>
        </div>`,
        { closeButton: false },
      );

      markersRef.current!.addLayer(marker);
    });

    // 全マーカーが収まるようにフィット
    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map((s) => [s.lat, s.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [stores]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}
