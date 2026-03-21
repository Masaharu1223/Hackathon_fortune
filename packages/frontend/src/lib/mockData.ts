import type { Store } from './api';

export const MOCK_STORES: Store[] = [
  {
    storeId: '3b6d6a77-a9ac-482c-9874-2ff8dd4cb265',
    storeName: 'セブン-イレブン 渋谷道玄坂店',
    address: '東京都渋谷区道玄坂1-12-1',
    lat: 35.6591,
    lng: 139.6989,
    distanceKm: 0.3,
    series: [
      {
        seriesId: '54a7e335-0ae5-4836-a6e9-2f5a14d6079d',
        title: '一番くじ ドラゴンボール STRONG CHAINS!!',
        price: 790,
        releaseDate: '2026-03-15',
        totalTickets: 80,
        remainingTickets: 23,
        status: 'on_sale',
        prizes: [
          { rank: 'A', name: '孫悟空 フィギュア', quantity: 1, remaining: 1 },
          { rank: 'B', name: 'ベジータ フィギュア', quantity: 1, remaining: 1 },
          { rank: 'C', name: 'アクリルスタンド', quantity: 5, remaining: 3 },
          { rank: 'D', name: 'タオル', quantity: 10, remaining: 6 },
        ],
      },
      {
        seriesId: 'cf1ab6a8-d2b1-4fe3-b44c-1f8bb5eabba2',
        title: '一番くじ 呪術廻戦 ～壊玉・玉折～',
        price: 750,
        releaseDate: '2026-04-01',
        totalTickets: 70,
        remainingTickets: 70,
        status: 'upcoming',
        prizes: [
          { rank: 'A', name: '五条悟 フィギュア', quantity: 1, remaining: 1 },
          { rank: 'B', name: '夏油傑 フィギュア', quantity: 1, remaining: 1 },
          { rank: 'C', name: 'アクリルスタンド', quantity: 8, remaining: 8 },
        ],
      },
    ],
  },
  {
    storeId: 'f54d1a2a-833b-4b35-aaf1-8e47e40ac796',
    storeName: 'ローソン 渋谷センター街店',
    address: '東京都渋谷区宇田川町31-2',
    lat: 35.6614,
    lng: 139.6983,
    distanceKm: 0.6,
    series: [
      {
        seriesId: 'e7add3a8-c6e5-4279-9f46-a98e8912445c',
        title: '一番くじ ワンピース ～新世界編～',
        price: 790,
        releaseDate: '2026-02-20',
        totalTickets: 80,
        remainingTickets: 5,
        status: 'on_sale',
        prizes: [
          { rank: 'A', name: 'ルフィ ギア5フィギュア', quantity: 1, remaining: 1 },
          { rank: 'B', name: 'ゾロ フィギュア', quantity: 1, remaining: 1 },
          { rank: 'C', name: 'アクリルスタンド', quantity: 5, remaining: 2 },
        ],
      },
    ],
  },
  {
    storeId: '3b36b879-bb41-4df9-b7aa-ff9cba33f89c',
    storeName: 'ファミリーマート 渋谷公園通り店',
    address: '東京都渋谷区宇田川町12-7',
    lat: 35.6628,
    lng: 139.6974,
    distanceKm: 0.9,
    series: [
      {
        seriesId: 'a66cabb5-fdd4-4993-9404-bf225579d0d1',
        title: '一番くじ 鬼滅の刃 ～柱稽古編～',
        price: 790,
        releaseDate: '2026-03-10',
        totalTickets: 80,
        remainingTickets: 42,
        status: 'on_sale',
        prizes: [
          { rank: 'A', name: '炭治郎 フィギュア', quantity: 1, remaining: 1 },
          { rank: 'B', name: '禰豆子 フィギュア', quantity: 1, remaining: 1 },
          { rank: 'C', name: 'アクリルスタンド', quantity: 5, remaining: 3 },
          { rank: 'D', name: 'タオル', quantity: 10, remaining: 6 },
        ],
      },
    ],
  },
];
