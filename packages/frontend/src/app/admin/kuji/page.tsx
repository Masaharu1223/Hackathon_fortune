'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import KujiInventoryClient from '../stores/[storeId]/kuji/[seriesId]/client';

function KujiInventoryWrapper() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId') ?? '';
  const seriesId = searchParams.get('seriesId') ?? '';

  if (!storeId || !seriesId) {
    return (
      <div className="ui-panel-warning rounded-xl p-6 text-center">
        <p className="text-sm text-warning">storeId と seriesId が必要です</p>
      </div>
    );
  }

  return <KujiInventoryClient storeId={storeId} seriesId={seriesId} />;
}

export default function KujiInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="ui-spinner mb-4 h-10 w-10 animate-spin rounded-full border-4" />
          <p className="text-sm text-content-muted">読み込み中...</p>
        </div>
      }
    >
      <KujiInventoryWrapper />
    </Suspense>
  );
}
