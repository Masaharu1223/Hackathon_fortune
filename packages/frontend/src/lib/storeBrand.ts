export type StoreBrand = 'lawson' | 'familymart' | 'seven-eleven' | 'other';

export const STORE_BRAND_OPTIONS: Array<{ value: StoreBrand; label: string }> = [
  { value: 'other', label: 'その他' },
  { value: 'lawson', label: 'ローソン' },
  { value: 'familymart', label: 'ファミマ' },
  { value: 'seven-eleven', label: 'セブン' },
];

export function inferStoreBrandFromName(storeName: string): StoreBrand {
  const normalizedName = storeName.toLowerCase();

  if (normalizedName.includes('ローソン') || normalizedName.includes('lawson')) {
    return 'lawson';
  }

  if (
    normalizedName.includes('ファミリーマート')
    || normalizedName.includes('ファミマ')
    || normalizedName.includes('familymart')
  ) {
    return 'familymart';
  }

  if (
    normalizedName.includes('セブン')
    || normalizedName.includes('7-eleven')
    || normalizedName.includes('seven-eleven')
    || normalizedName.includes('seven')
  ) {
    return 'seven-eleven';
  }

  return 'other';
}

export function normalizeStoreBrand(storeBrand: unknown, storeName: string): StoreBrand {
  switch (storeBrand) {
    case 'lawson':
    case 'familymart':
    case 'seven-eleven':
    case 'other':
      return storeBrand;
    default:
      return inferStoreBrandFromName(storeName);
  }
}

export function getStoreBrandImagePath(storeBrand: StoreBrand): string {
  switch (storeBrand) {
    case 'lawson':
      return '/1-lowson.png';
    case 'familymart':
      return '/2-family.png';
    case 'seven-eleven':
      return '/3-seven.png';
    default:
      return '/shop_logo.png';
  }
}
