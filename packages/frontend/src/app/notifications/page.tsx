'use client';

import { useState } from 'react';
import { getNotifications, type Notification } from '@/lib/mockNotifications';
import { getMyStores } from '@/lib/myStores';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export default function NotificationsPage() {
  const [notifications] = useState<Notification[]>(() => getNotifications());
  const [hasMyStores] = useState(() => getMyStores().length > 0);

  if (!hasMyStores) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-background p-4">
          <svg className="h-8 w-8 text-content-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <p className="text-base font-semibold text-content">お知らせはありません</p>
        <p className="mt-2 text-sm text-content-muted">
          通知対象の店舗がまだないため<br />表示できるお知らせがありません
        </p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-background p-4">
          <svg className="h-8 w-8 text-content-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-content">新しいお知らせはありません</p>
        <p className="mt-2 text-sm text-content-muted">
          マイ店舗に新しい入荷があると<br />ここに通知が表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-content-strong">お知らせ</h1>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`ui-badge px-2 py-0.5 text-xs font-semibold ${
                n.type === 'new_arrival'
                  ? 'ui-badge-brand-strong'
                  : 'ui-badge-success-emphasis'
              }`}
            >
              {n.type === 'new_arrival' ? '新規入荷' : '在庫復活'}
            </span>
            <span className="text-xs text-content-subtle">{formatDate(n.created_at)}</span>
          </div>
          <p className="text-sm font-semibold text-content-strong">{n.store_name}</p>
          <p className="mt-1 text-sm text-content">{n.series_title}</p>
          <p className="mt-0.5 text-xs text-content-muted">{n.prize_name}</p>
        </div>
      ))}
    </div>
  );
}
