import type { KujiSeries, Prize } from '@ichiban-kuji/shared';

export interface SeedKujiSeriesFixture {
  seriesId: string;
  title: string;
  price: number;
  releaseDate: string;
  totalTickets: number;
  remainingTickets: number;
  prizes: Prize[];
  status: KujiSeries['status'];
}

export interface SeedStoreFixture {
  storeId: string;
  storeName: string;
  address: string;
  lat: number;
  lng: number;
  kujiSeries: SeedKujiSeriesFixture[];
}

export interface SeedRegionFixture {
  label: string;
  managerId: string;
  stores: SeedStoreFixture[];
}

const minamiMachidaStores: SeedStoreFixture[] = [
  {
    storeId: 'seed-minami-machida-store-001',
    storeName: 'セブン-イレブン 南町田駅前店',
    address: '東京都町田市鶴間3-4-1',
    lat: 35.5139,
    lng: 139.4707,
    kujiSeries: [
      {
        seriesId: 'seed-minami-machida-series-001-01',
        title: '一番くじ ドラゴンボール EX 孫悟空修業編',
        price: 790,
        releaseDate: '2026-03-14',
        totalTickets: 80,
        remainingTickets: 22,
        status: 'on_sale',
        prizes: [
          { rank: 'A賞', name: '孫悟空 フィギュア', quantity: 1 },
          { rank: 'B賞', name: 'クリリン フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'アクリルスタンド', quantity: 8 },
          { rank: 'ラストワン賞', name: '筋斗雲ディスプレイ', quantity: 1 },
        ],
      },
      {
        seriesId: 'seed-minami-machida-series-001-02',
        title: '一番くじ 呪術廻戦 渋谷事変 参',
        price: 750,
        releaseDate: '2026-04-05',
        totalTickets: 70,
        remainingTickets: 70,
        status: 'upcoming',
        prizes: [
          { rank: 'A賞', name: '五条悟 フィギュア', quantity: 1 },
          { rank: 'B賞', name: '宿儺 フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'ラバーチャーム', quantity: 10 },
        ],
      },
    ],
  },
  {
    storeId: 'seed-minami-machida-store-002',
    storeName: 'ローソン グランベリーパーク前店',
    address: '東京都町田市鶴間3-3-8',
    lat: 35.5124,
    lng: 139.4692,
    kujiSeries: [
      {
        seriesId: 'seed-minami-machida-series-002-01',
        title: '一番くじ ワンピース 覇王ノ航路',
        price: 790,
        releaseDate: '2026-03-08',
        totalTickets: 80,
        remainingTickets: 9,
        status: 'on_sale',
        prizes: [
          { rank: 'A賞', name: 'ルフィ フィギュア', quantity: 1 },
          { rank: 'B賞', name: 'ゾロ フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'タオルコレクション', quantity: 8 },
          { rank: 'ラストワン賞', name: 'ギア5 ルフィ', quantity: 1 },
        ],
      },
    ],
  },
  {
    storeId: 'seed-minami-machida-store-003',
    storeName: 'ファミリーマート 南町田三丁目店',
    address: '東京都町田市鶴間3-1-12',
    lat: 35.5109,
    lng: 139.4684,
    kujiSeries: [
      {
        seriesId: 'seed-minami-machida-series-003-01',
        title: '一番くじ 鬼滅の刃 柱稽古開幕',
        price: 790,
        releaseDate: '2026-03-11',
        totalTickets: 80,
        remainingTickets: 35,
        status: 'on_sale',
        prizes: [
          { rank: 'A賞', name: '炭治郎 フィギュア', quantity: 1 },
          { rank: 'B賞', name: '禰豆子 フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'ビジュアルタオル', quantity: 10 },
          { rank: 'D賞', name: 'クリアファイル', quantity: 12 },
        ],
      },
      {
        seriesId: 'seed-minami-machida-series-003-02',
        title: '一番くじ 進撃の巨人 FINAL SEASON',
        price: 850,
        releaseDate: '2026-01-20',
        totalTickets: 60,
        remainingTickets: 0,
        status: 'sold_out',
        prizes: [
          { rank: 'A賞', name: 'エレン フィギュア', quantity: 1 },
          { rank: 'B賞', name: 'リヴァイ フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'アクリルボード', quantity: 6 },
        ],
      },
    ],
  },
  {
    storeId: 'seed-minami-machida-store-004',
    storeName: 'ミニストップ 南町田北口店',
    address: '東京都町田市鶴間2-5-4',
    lat: 35.5164,
    lng: 139.4721,
    kujiSeries: [
      {
        seriesId: 'seed-minami-machida-series-004-01',
        title: '一番くじ 僕のヒーローアカデミア NEXT STEP',
        price: 750,
        releaseDate: '2026-03-28',
        totalTickets: 80,
        remainingTickets: 80,
        status: 'upcoming',
        prizes: [
          { rank: 'A賞', name: '緑谷出久 フィギュア', quantity: 1 },
          { rank: 'B賞', name: '爆豪勝己 フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'アクリルスタンドセット', quantity: 8 },
        ],
      },
    ],
  },
  {
    storeId: 'seed-minami-machida-store-005',
    storeName: 'セブン-イレブン 南町田鶴間公園店',
    address: '東京都町田市鶴間2-1-6',
    lat: 35.5092,
    lng: 139.4728,
    kujiSeries: [
      {
        seriesId: 'seed-minami-machida-series-005-01',
        title: '一番くじ SPY×FAMILY MISSION 9',
        price: 700,
        releaseDate: '2026-03-02',
        totalTickets: 70,
        remainingTickets: 18,
        status: 'on_sale',
        prizes: [
          { rank: 'A賞', name: 'アーニャ フィギュア', quantity: 1 },
          { rank: 'B賞', name: 'ロイド フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'ぬいぐるみマスコット', quantity: 6 },
          { rank: 'D賞', name: 'タオルセット', quantity: 8 },
        ],
      },
      {
        seriesId: 'seed-minami-machida-series-005-02',
        title: '一番くじ ハイキュー!! 烏野の朝',
        price: 730,
        releaseDate: '2026-03-19',
        totalTickets: 75,
        remainingTickets: 51,
        status: 'on_sale',
        prizes: [
          { rank: 'A賞', name: '日向翔陽 フィギュア', quantity: 1 },
          { rank: 'B賞', name: '影山飛雄 フィギュア', quantity: 2 },
          { rank: 'C賞', name: 'ビジュアルボード', quantity: 8 },
          { rank: 'D賞', name: 'ラバーチャーム', quantity: 12 },
        ],
      },
    ],
  },
];

export const seedStoreRegions: Record<string, SeedRegionFixture> = {
  'minami-machida': {
    label: '南町田周辺',
    managerId: 'seed-manager-minami-machida',
    stores: minamiMachidaStores,
  },
};

export const DEFAULT_SEED_REGION = 'minami-machida';
