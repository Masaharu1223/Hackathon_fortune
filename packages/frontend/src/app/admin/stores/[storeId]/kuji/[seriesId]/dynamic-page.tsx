'use client';

import { useParams } from 'next/navigation';
import KujiInventoryClient from './client';

export default function DynamicKujiPage() {
  const { storeId, seriesId } = useParams<{ storeId: string; seriesId: string }>();
  return <KujiInventoryClient storeId={storeId ?? ''} seriesId={seriesId ?? ''} />;
}
