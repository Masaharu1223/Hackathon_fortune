export const TABLE_NAME = process.env.TABLE_NAME ?? 'IchibanKujiTable';
export const GEO_TABLE_NAME = process.env.GEO_TABLE_NAME ?? 'StoreGeoTable';

export const MAX_DRAWS_PER_RESERVATION = 3;
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;

export const ENTITY_PREFIXES = {
  USER: 'USER#',
  STORE: 'STORE#',
  SERIES: 'SERIES#',
  KUJI: 'KUJI#',
  WATCH: 'WATCH#',
  RESERVATION: 'RESERVATION#',
  LOTTERY: 'LOTTERY#',
  PROFILE: 'PROFILE',
} as const;

export const GSI = {
  GSI1: 'GSI1',
  GSI2: 'GSI2',
  GSI3: 'GSI3',
} as const;

export const NOTIFICATION_QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL ?? '';
