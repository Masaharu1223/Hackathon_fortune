import { getMyStores } from './myStores';

export interface Notification {
  id: string;
  store_id: string;
  store_name: string;
  series_title: string;
  prize_name: string;
  type: 'new_arrival' | 'restock';
  created_at: string;
}

const MOCK_NOTIFICATIONS_POOL: Omit<Notification, 'id'>[] = [
  {
    store_id: 'store_001',
    store_name: 'セブン-イレブン 渋谷道玄坂店',
    series_title: '一番くじ ドラゴンボール STRONG CHAINS!!',
    prize_name: '孫悟空 フィギュア',
    type: 'new_arrival',
    created_at: '2026-03-17T10:00:00+09:00',
  },
  {
    store_id: 'store_001',
    store_name: 'セブン-イレブン 渋谷道玄坂店',
    series_title: '一番くじ 呪術廻戦 ～壊玉・玉折～',
    prize_name: '五条悟 フィギュア',
    type: 'new_arrival',
    created_at: '2026-03-16T14:30:00+09:00',
  },
  {
    store_id: 'store_002',
    store_name: 'ローソン 渋谷センター街店',
    series_title: '一番くじ ワンピース ～新世界編～',
    prize_name: 'ゾロ フィギュア',
    type: 'restock',
    created_at: '2026-03-17T09:15:00+09:00',
  },
  {
    store_id: 'store_003',
    store_name: 'ファミリーマート 渋谷公園通り店',
    series_title: '一番くじ 鬼滅の刃 ～柱稽古編～',
    prize_name: '炭治郎 フィギュア',
    type: 'new_arrival',
    created_at: '2026-03-15T11:00:00+09:00',
  },
  {
    store_id: 'store_003',
    store_name: 'ファミリーマート 渋谷公園通り店',
    series_title: '一番くじ 鬼滅の刃 ～柱稽古編～',
    prize_name: '禰豆子 フィギュア',
    type: 'restock',
    created_at: '2026-03-16T08:45:00+09:00',
  },
  {
    store_id: 'store_004',
    store_name: 'セブン-イレブン 原宿表参道店',
    series_title: '一番くじ 僕のヒーローアカデミア NEXT GENERATIONS!',
    prize_name: 'デク フィギュア',
    type: 'new_arrival',
    created_at: '2026-03-14T16:00:00+09:00',
  },
  {
    store_id: 'store_005',
    store_name: 'ローソン 代官山蔦屋書店前店',
    series_title: '一番くじ SPY×FAMILY MISSION:8',
    prize_name: 'アーニャ フィギュア',
    type: 'restock',
    created_at: '2026-03-17T07:30:00+09:00',
  },
  {
    store_id: 'store_005',
    store_name: 'ローソン 代官山蔦屋書店前店',
    series_title: '一番くじ SPY×FAMILY MISSION:8',
    prize_name: 'ロイド フィギュア',
    type: 'new_arrival',
    created_at: '2026-03-13T12:00:00+09:00',
  },
];

export function getNotifications(): Notification[] {
  const myStoreIds = getMyStores();
  if (myStoreIds.length === 0) return [];

  return MOCK_NOTIFICATIONS_POOL
    .filter((n) => myStoreIds.includes(n.store_id))
    .map((n, i) => ({ ...n, id: `notif_${i}` }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
