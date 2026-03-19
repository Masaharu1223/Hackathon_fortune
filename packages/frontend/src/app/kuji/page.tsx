import Link from 'next/link';
import type { KujiSeries } from '@/lib/api';
import { MOCK_STORES } from '@/lib/mockData';

type KujiListing = {
  storeId: string;
  storeName: string;
  address: string;
  distanceKm?: number;
  series: KujiSeries;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function formatDistance(distanceKm?: number): string | null {
  if (distanceKm === undefined) return null;

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

function prizePreview(prizes: KujiSeries['prizes']): string {
  return prizes
    .slice(0, 3)
    .map((prize) => `${prize.rank}賞 ${prize.name}`)
    .join(' / ');
}

function KujiListingCard({
  listing,
  variant,
}: {
  listing: KujiListing;
  variant: 'upcoming' | 'on_sale';
}) {
  const { series } = listing;
  const distance = formatDistance(listing.distanceKm);

  return (
    <article
      className={`ui-card rounded-2xl p-5 shadow-sm ${
        variant === 'upcoming' ? 'border-brand-border bg-gradient-to-br from-surface to-brand-soft/70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-content-subtle">1回 {series.price}円</p>

          <h2 className="mt-2 text-lg font-semibold leading-7 text-content-strong">
            {series.title}
          </h2>

          <p className="mt-1 text-sm font-medium text-content">
            {listing.storeName}
          </p>
          <p className="mt-0.5 text-sm text-content-muted">{listing.address}</p>
        </div>

        {distance && (
          <span className="ui-badge ui-badge-neutral shrink-0 px-2.5 py-1 text-xs">
            {distance}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div
          className={`rounded-xl px-4 py-3 ${
            variant === 'upcoming' ? 'bg-white/70' : 'bg-success-soft'
          }`}
        >
          <p className="text-xs font-medium tracking-[0.16em] text-content-subtle">
            {variant === 'upcoming' ? '発売日' : '発売中：残り枚数'}
          </p>
          <p className="mt-1 text-sm font-semibold text-content-strong">
            {variant === 'upcoming'
              ? formatDate(series.releaseDate)
              : `${series.remainingTickets} / ${series.totalTickets}枚`}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-subtle">
            {variant === 'upcoming' ? '予約条件' : '発売日'}
          </p>
          <p className="mt-1 text-sm font-semibold text-content-strong">
            {variant === 'upcoming' ? '最大3枚まで予約可' : formatDate(series.releaseDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-background/80 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-subtle">
          注目賞品
        </p>
        <p className="mt-1 text-sm leading-6 text-content">
          {series.prizes.length > 0 ? prizePreview(series.prizes) : '賞品情報は準備中です'}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {variant === 'upcoming' ? (
          <div className="rounded-full bg-brand-soft/70 px-3 py-1.5 text-xs text-content-muted">
            抽選予約受付中
          </div>
        ) : (
          <div />
        )}

        <Link
          href={`/stores/detail/?id=${listing.storeId}`}
          className="ui-button-primary shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          店舗の詳細へ
        </Link>
      </div>
    </article>
  );
}

export default function KujiPage() {
  const listings: KujiListing[] = MOCK_STORES.flatMap((store) =>
    store.series.map((series) => ({
      storeId: store.storeId,
      storeName: store.storeName,
      address: store.address,
      distanceKm: store.distanceKm,
      series,
    })),
  );

  const lotteryListings = listings
    .filter((listing) => listing.series.status === 'upcoming')
    .sort((a, b) => a.series.releaseDate.localeCompare(b.series.releaseDate));

  const onSaleListings = listings
    .filter((listing) => listing.series.status === 'on_sale')
    .sort((a, b) => a.series.remainingTickets - b.series.remainingTickets);

  return (
    <div className="space-y-8 pb-24">
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-content-strong">
            発売予定
          </h2>
          <span className="ui-badge ui-badge-brand px-3 py-1 text-xs">
            {lotteryListings.length}件
          </span>
        </div>

        {lotteryListings.length > 0 ? (
          <div className="space-y-4">
            {lotteryListings.map((listing) => (
              <KujiListingCard
                key={`${listing.storeId}-${listing.series.seriesId}`}
                listing={listing}
                variant="upcoming"
              />
            ))}
          </div>
        ) : (
          <div className="ui-panel-muted rounded-2xl p-6 text-center">
            <p className="text-sm text-content-muted">
              抽選対象のくじはまだありません
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-content-strong">
              いま販売中のくじ
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              現在販売中のくじも合わせて確認できます。
            </p>
          </div>
          <span className="ui-badge ui-badge-success px-3 py-1 text-xs">
            {onSaleListings.length}件
          </span>
        </div>

        {onSaleListings.length > 0 ? (
          <div className="space-y-4">
            {onSaleListings.map((listing) => (
              <KujiListingCard
                key={`${listing.storeId}-${listing.series.seriesId}`}
                listing={listing}
                variant="on_sale"
              />
            ))}
          </div>
        ) : (
          <div className="ui-panel-muted rounded-2xl p-6 text-center">
            <p className="text-sm text-content-muted">
              販売中のくじはまだありません
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
