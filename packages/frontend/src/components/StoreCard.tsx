'use client';

import Link from 'next/link';
import type { Store } from '@/lib/api';

function statusBadge(status: string) {
  switch (status) {
    case 'on_sale':
      return (
        <span className="ui-badge ui-badge-success px-2 py-0.5 text-xs">
          販売中
        </span>
      );
    case 'upcoming':
      return (
        <span className="ui-badge ui-badge-info px-2 py-0.5 text-xs">
          発売予定
        </span>
      );
    case 'sold_out':
      return (
        <span className="ui-badge ui-badge-neutral px-2 py-0.5 text-xs">
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
      href={`/stores/detail/?id=${store.storeId}`}
      className="ui-card block rounded-xl p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-content-strong">{store.storeName}</h3>
          <p className="mt-0.5 text-sm text-content-muted">{store.address}</p>
        </div>
        {store.distanceKm !== undefined && (
          <span className="ui-badge ui-badge-brand shrink-0 px-2.5 py-1 text-xs">
            {store.distanceKm < 1
              ? `${Math.round(store.distanceKm * 1000)}m`
              : `${store.distanceKm.toFixed(1)}km`}
          </span>
        )}
      </div>

      {store.series && store.series.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {store.series.map((s) => (
            <div
              key={s.seriesId}
              className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs text-content"
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
