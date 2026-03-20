'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const MAP_NAME = process.env.NEXT_PUBLIC_AWS_LOCATION_MAP_NAME || 'dev-IchibanKuji-Location-Map';
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1';
const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID || '';

export default function StoreMap({ stores, center }: StoreMapProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const currentLocMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        // 一時的にOpenStreetMapを使用（AWS Location Serviceはデプロイ後に有効化）
        const useAWSLocation = IDENTITY_POOL_ID && MAP_NAME;
        
        if (useAWSLocation) {
          const styleUrl = `https://maps.geo.${REGION}.amazonaws.com/maps/v0/maps/${MAP_NAME}/style-descriptor`;
          mapRef.current = new maplibregl.Map({
            container: containerRef.current!,
            style: styleUrl,
            center: [center.lng, center.lat],
            zoom: 14,
          });
        } else {
          // OpenStreetMapをフォールバックとして使用
          mapRef.current = new maplibregl.Map({
            container: containerRef.current!,
            style: {
              version: 8,
              sources: {
                'osm': {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '&copy; OpenStreetMap contributors'
                }
              },
              layers: [{
                id: 'osm',
                type: 'raster',
                source: 'osm'
              }]
            },
            center: [center.lng, center.lat],
            zoom: 14,
          });
        }

        mapRef.current.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'bottom-right'
        );
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(m => m.remove());
      currentLocMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (stores.length === 0) return;

    stores.forEach((store) => {
      const el = document.createElement('div');
      el.className = 'store-map-marker-icon';
      el.innerHTML = `
        <div class="store-map-marker">
          <img src="/shop_logo.png" alt="" class="store-map-marker-image" />
          <span class="store-map-marker-badge">${store.remainingTickets}</span>
        </div>
      `;
      el.style.width = '52px';
      el.style.height = '52px';

      const prizesHtml = store.matchedPrizes
        .map((p) => `<span class="store-map-prize">${p}</span>`)
        .join('');

      const popupContent = `
        <div class="store-map-popup">
          <div class="store-map-name">${store.storeName}</div>
          <div class="store-map-address">${store.address}</div>
          <div class="store-map-remaining">残り ${store.remainingTickets} 枚</div>
          <div class="store-map-prizes">${prizesHtml}</div>
          <div class="store-map-actions">
            <a href="/stores/detail/?id=${store.storeId}" class="store-map-button store-map-button--detail">店舗の詳細</a>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ closeButton: false, offset: 25 })
        .setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    if (currentLocMarkerRef.current) {
      currentLocMarkerRef.current.remove();
    }

    const currentEl = document.createElement('div');
    currentEl.style.width = '16px';
    currentEl.style.height = '16px';
    currentEl.style.background = '#4285F4';
    currentEl.style.border = '3px solid white';
    currentEl.style.borderRadius = '50%';
    currentEl.style.boxShadow = '0 0 8px rgba(66,133,244,0.5)';

    currentLocMarkerRef.current = new maplibregl.Marker({ element: currentEl })
      .setLngLat([center.lng, center.lat])
      .addTo(mapRef.current!);

    const bounds = new maplibregl.LngLatBounds();
    stores.forEach(s => bounds.extend([s.lng, s.lat]));
    bounds.extend([center.lng, center.lat]);

    if (stores.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    }
  }, [stores, center.lat, center.lng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  );
}
