import KujiInventoryClient from './client';

export default async function Page({
  params,
}: {
  params: Promise<{ storeId: string; seriesId: string }>;
}) {
  const { storeId, seriesId } = await params;
  return <KujiInventoryClient storeId={storeId} seriesId={seriesId} />;
}
