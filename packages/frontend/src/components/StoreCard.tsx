'use client';

import Link from 'next/link';
import type { Store } from '@/lib/api';

function statusBadge(status: string) {
  switch (status) {
    case 'on_sale':
      return (
        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          販売中
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          発売予定
        </span>
      );
    case 'sold_out':
      return (
        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          完売
        </span>
      );
    default:
      return null;
  }
}

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  return (
    <Link
      href={`/stores/detail/?id=${store.store_id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{store.name}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{store.address}</p>
        </div>
        {store.distance_km !== undefined && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
            {store.distance_km < 1
              ? `${Math.round(store.distance_km * 1000)}m`
              : `${store.distance_km.toFixed(1)}km`}
          </span>
        )}
      </div>

      {store.series && store.series.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {store.series.map((s) => (
            <div
              key={s.series_id}
              className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700"
            >
              <span className="truncate max-w-[140px]">{s.title}</span>
              {statusBadge(s.status)}
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
