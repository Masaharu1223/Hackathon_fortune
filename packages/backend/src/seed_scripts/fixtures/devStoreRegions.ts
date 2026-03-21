import type { KujiSeries, Prize, StoreBrand } from '@ichiban-kuji/shared';

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
  storeBrand?: StoreBrand;
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

type SeedKujiTemplate = Omit<SeedKujiSeriesFixture, 'seriesId'>;

interface SeedStoreBlueprint {
  storeName: string;
  address: string;
  latOffset: number;
  lngOffset: number;
  seriesCount: number;
}

const meguroStationCenter = {
  lat: 35.633998,
  lng: 139.715828,
};

const meguroKujiTemplates: SeedKujiTemplate[] = [
  {
    title: '一番くじ ドラゴンボール EX サイヤ人の系譜',
    price: 790,
    releaseDate: '2026-03-14',
    totalTickets: 80,
    remainingTickets: 24,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: '孫悟空 フィギュア', quantity: 1 },
      { rank: 'B賞', name: 'ベジータ フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'アクリルスタンド', quantity: 8 },
      { rank: 'ラストワン賞', name: '大猿ベジータ', quantity: 1 },
    ],
  },
  {
    title: '一番くじ ワンピース 海賊王への道',
    price: 790,
    releaseDate: '2026-03-08',
    totalTickets: 80,
    remainingTickets: 11,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: 'ルフィ ギア5 フィギュア', quantity: 1 },
      { rank: 'B賞', name: 'ゾロ フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'タオルコレクション', quantity: 8 },
      { rank: 'ラストワン賞', name: 'ニカ ルフィ', quantity: 1 },
    ],
  },
  {
    title: '一番くじ 鬼滅の刃 刀鍛冶の里 其ノ弐',
    price: 790,
    releaseDate: '2026-03-11',
    totalTickets: 80,
    remainingTickets: 31,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: '炭治郎 フィギュア', quantity: 1 },
      { rank: 'B賞', name: '時透無一郎 フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'ビジュアルタオル', quantity: 10 },
      { rank: 'D賞', name: 'クリアファイル', quantity: 12 },
    ],
  },
  {
    title: '一番くじ 僕のヒーローアカデミア UP TO THE SKY',
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
  {
    title: '一番くじ SPY×FAMILY MISSION ARCHIVE',
    price: 700,
    releaseDate: '2026-03-02',
    totalTickets: 70,
    remainingTickets: 19,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: 'アーニャ フィギュア', quantity: 1 },
      { rank: 'B賞', name: 'ロイド フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'ぬいぐるみマスコット', quantity: 6 },
      { rank: 'D賞', name: 'タオルセット', quantity: 8 },
    ],
  },
  {
    title: '一番くじ ハイキュー!! 熱戦の軌跡',
    price: 730,
    releaseDate: '2026-03-19',
    totalTickets: 75,
    remainingTickets: 44,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: '日向翔陽 フィギュア', quantity: 1 },
      { rank: 'B賞', name: '影山飛雄 フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'ビジュアルボード', quantity: 8 },
      { rank: 'D賞', name: 'ラバーチャーム', quantity: 12 },
    ],
  },
  {
    title: '一番くじ 呪術廻戦 懐玉・玉折',
    price: 780,
    releaseDate: '2026-04-05',
    totalTickets: 70,
    remainingTickets: 70,
    status: 'upcoming',
    prizes: [
      { rank: 'A賞', name: '五条悟 フィギュア', quantity: 1 },
      { rank: 'B賞', name: '夏油傑 フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'ラバーチャーム', quantity: 10 },
    ],
  },
  {
    title: '一番くじ 進撃の巨人 The Final Wall',
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
  {
    title: '一番くじ ブルーロック EGOIST BATTLE',
    price: 770,
    releaseDate: '2026-03-22',
    totalTickets: 80,
    remainingTickets: 27,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: '潔世一 フィギュア', quantity: 1 },
      { rank: 'B賞', name: '糸師凛 フィギュア', quantity: 2 },
      { rank: 'C賞', name: 'アクリルキーホルダー', quantity: 10 },
    ],
  },
  {
    title: '一番くじ Pokemon ADVENTURE COLLECTION',
    price: 680,
    releaseDate: '2026-02-27',
    totalTickets: 70,
    remainingTickets: 14,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: 'ピカチュウ ぬいぐるみ', quantity: 1 },
      { rank: 'B賞', name: 'イーブイ ぬいぐるみ', quantity: 2 },
      { rank: 'C賞', name: 'プレートセット', quantity: 8 },
    ],
  },
  {
    title: '一番くじ NARUTO 受け継がれる火の意志',
    price: 790,
    releaseDate: '2026-03-30',
    totalTickets: 80,
    remainingTickets: 80,
    status: 'upcoming',
    prizes: [
      { rank: 'A賞', name: 'うずまきナルト フィギュア', quantity: 1 },
      { rank: 'B賞', name: 'うちはサスケ フィギュア', quantity: 2 },
      { rank: 'C賞', name: '忍具コレクション', quantity: 8 },
    ],
  },
  {
    title: '一番くじ 初音ミク Glitter Stage',
    price: 800,
    releaseDate: '2026-03-16',
    totalTickets: 65,
    remainingTickets: 9,
    status: 'on_sale',
    prizes: [
      { rank: 'A賞', name: '初音ミク フィギュア', quantity: 1 },
      { rank: 'B賞', name: 'アクリルパネル', quantity: 2 },
      { rank: 'C賞', name: 'ラバーストラップ', quantity: 8 },
    ],
  },
];

const meguroStoreBlueprints: SeedStoreBlueprint[] = [
  {
    storeName: 'セブン-イレブン 目黒駅東口店',
    address: '東京都品川区上大崎2-16-1',
    latOffset: 0.0009,
    lngOffset: 0.0004,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 目黒駅中央口店',
    address: '東京都品川区上大崎3-1-2',
    latOffset: 0.0004,
    lngOffset: 0.0001,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 目黒一丁目店',
    address: '東京都目黒区目黒1-4-6',
    latOffset: -0.0003,
    lngOffset: -0.0005,
    seriesCount: 2,
  },
  {
    storeName: 'NewDays 目黒店',
    address: '東京都品川区上大崎2-16-9',
    latOffset: 0.0001,
    lngOffset: -0.0002,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 上大崎二丁目店',
    address: '東京都品川区上大崎2-18-20',
    latOffset: 0.0012,
    lngOffset: 0.0008,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 目黒行人坂店',
    address: '東京都目黒区下目黒1-8-1',
    latOffset: -0.001,
    lngOffset: -0.0009,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 目黒雅叙園前店',
    address: '東京都目黒区下目黒1-8-3',
    latOffset: -0.0014,
    lngOffset: -0.0011,
    seriesCount: 2,
  },
  {
    storeName: 'まいばすけっと 上大崎2丁目店',
    address: '東京都品川区上大崎2-13-5',
    latOffset: 0.001,
    lngOffset: -0.0006,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 目黒権之助坂店',
    address: '東京都目黒区目黒1-5-19',
    latOffset: -0.0007,
    lngOffset: -0.0012,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート アトレ目黒店',
    address: '東京都品川区上大崎2-16-9',
    latOffset: 0.0003,
    lngOffset: 0.0005,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 目黒大鳥神社前店',
    address: '東京都目黒区下目黒3-1-2',
    latOffset: -0.0028,
    lngOffset: -0.0015,
    seriesCount: 2,
  },
  {
    storeName: 'セブン-イレブン 下目黒一丁目店',
    address: '東京都目黒区下目黒1-2-21',
    latOffset: -0.0015,
    lngOffset: -0.0004,
    seriesCount: 1,
  },
  {
    storeName: 'ファミリーマート 目黒三田通り店',
    address: '東京都目黒区三田1-4-3',
    latOffset: 0.0016,
    lngOffset: 0.0014,
    seriesCount: 2,
  },
  {
    storeName: 'ローソン 目黒三田一丁目店',
    address: '東京都目黒区三田1-11-1',
    latOffset: 0.0021,
    lngOffset: 0.0017,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 白金台一丁目店',
    address: '東京都港区白金台1-1-12',
    latOffset: 0.0026,
    lngOffset: 0.0024,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 上大崎三丁目店',
    address: '東京都品川区上大崎3-3-6',
    latOffset: 0.0015,
    lngOffset: 0.001,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 上大崎店',
    address: '東京都品川区上大崎3-5-8',
    latOffset: 0.0018,
    lngOffset: 0.0012,
    seriesCount: 2,
  },
  {
    storeName: 'まいばすけっと 下目黒2丁目店',
    address: '東京都目黒区下目黒2-18-5',
    latOffset: -0.0021,
    lngOffset: -0.0008,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 目黒柳通り店',
    address: '東京都目黒区目黒2-10-8',
    latOffset: -0.0024,
    lngOffset: -0.001,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 目黒アルコタワー店',
    address: '東京都目黒区下目黒1-8-1',
    latOffset: -0.0012,
    lngOffset: -0.0013,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 目黒中町通り店',
    address: '東京都目黒区下目黒2-20-20',
    latOffset: -0.0026,
    lngOffset: -0.0018,
    seriesCount: 2,
  },
  {
    storeName: 'セブン-イレブン 目黒清水台店',
    address: '東京都目黒区目黒1-24-12',
    latOffset: -0.0019,
    lngOffset: -0.0021,
    seriesCount: 1,
  },
  {
    storeName: 'ファミリーマート 恵比寿ガーデンプレイス前店',
    address: '東京都目黒区三田1-13-2',
    latOffset: 0.0024,
    lngOffset: 0.002,
    seriesCount: 2,
  },
  {
    storeName: 'ローソン 恵比寿三田通店',
    address: '東京都目黒区三田2-1-3',
    latOffset: 0.003,
    lngOffset: 0.0016,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 目黒不動前店',
    address: '東京都品川区西五反田3-7-6',
    latOffset: -0.0032,
    lngOffset: -0.0026,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 不動前駅北店',
    address: '東京都品川区西五反田4-30-8',
    latOffset: -0.0036,
    lngOffset: -0.0029,
    seriesCount: 1,
  },
  {
    storeName: 'ローソン 西五反田高齢者通り店',
    address: '東京都品川区西五反田3-12-6',
    latOffset: -0.0029,
    lngOffset: -0.0002,
    seriesCount: 2,
  },
  {
    storeName: 'まいばすけっと 西五反田3丁目店',
    address: '東京都品川区西五反田3-12-9',
    latOffset: -0.0031,
    lngOffset: 0.0001,
    seriesCount: 1,
  },
  {
    storeName: 'セブン-イレブン 白金台プラチナ通り店',
    address: '東京都港区白金台2-5-9',
    latOffset: 0.0034,
    lngOffset: 0.003,
    seriesCount: 2,
  },
  {
    storeName: 'ファミリーマート 目黒駅西口店',
    address: '東京都目黒区目黒1-3-16',
    latOffset: -0.0001,
    lngOffset: -0.0007,
    seriesCount: 1,
  },
];

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function buildMeguroKujiSeries(storeNumber: number, slotNumber: number): SeedKujiSeriesFixture {
  const template =
    meguroKujiTemplates[(storeNumber + slotNumber - 2) % meguroKujiTemplates.length];
  const variation = ((storeNumber * 7) + (slotNumber * 3)) % 13 - 6;

  const remainingTickets =
    template.status === 'sold_out'
      ? 0
      : template.status === 'upcoming'
        ? template.totalTickets
        : Math.max(
            1,
            Math.min(template.totalTickets - 1, template.remainingTickets + variation),
          );

  return {
    ...template,
    seriesId: `seed-meguro-station-series-${String(storeNumber).padStart(3, '0')}-${String(
      slotNumber,
    ).padStart(2, '0')}`,
    remainingTickets,
  };
}

// Generate a denser cluster around Meguro Station for nearby-store testing.
const meguroStationStores: SeedStoreFixture[] = meguroStoreBlueprints.map((blueprint, index) => {
  const storeNumber = index + 1;

  return {
    storeId: `seed-meguro-station-store-${String(storeNumber).padStart(3, '0')}`,
    storeName: blueprint.storeName,
    address: blueprint.address,
    lat: roundCoordinate(meguroStationCenter.lat + blueprint.latOffset),
    lng: roundCoordinate(meguroStationCenter.lng + blueprint.lngOffset),
    kujiSeries: Array.from({ length: blueprint.seriesCount }, (_, slotIndex) =>
      buildMeguroKujiSeries(storeNumber, slotIndex + 1),
    ),
  };
});

export const seedStoreRegions: Record<string, SeedRegionFixture> = {
  'minami-machida': {
    label: '南町田周辺',
    managerId: 'seed-manager-minami-machida',
    stores: minamiMachidaStores,
  },
  'meguro-station': {
    label: '目黒駅周辺',
    managerId: 'seed-manager-meguro-station',
    stores: meguroStationStores,
  },
};

export const DEFAULT_SEED_REGION = 'meguro-station';
