import KujiInventoryClient from './client';

export function generateStaticParams() {
  // Dynamic routes are resolved at runtime; return empty array for static export.
  return [];
}

export default async function Page({
  params,
}: {
  params: Promise<{ storeId: string; seriesId: string }>;
}) {
  const { storeId, seriesId } = await params;
  return <KujiInventoryClient storeId={storeId} seriesId={seriesId} />;
}
