import DynamicKujiPage from './dynamic-page';

export function generateStaticParams() {
  // Returns a dummy entry so the static export build passes.
  // Actual routing is handled client-side via the SPA fallback.
  return [{ storeId: '_', seriesId: '_' }];
}

export default function Page() {
  return <DynamicKujiPage />;
}
