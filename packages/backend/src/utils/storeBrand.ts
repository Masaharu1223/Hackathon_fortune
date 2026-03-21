import type { StoreBrand } from '@ichiban-kuji/shared';

const STORE_BRANDS: StoreBrand[] = ['lawson', 'familymart', 'seven-eleven', 'other'];

export function isStoreBrand(value: unknown): value is StoreBrand {
  return typeof value === 'string' && STORE_BRANDS.includes(value as StoreBrand);
}

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

export function resolveStoreBrand(storeBrand: unknown, storeName: string): StoreBrand {
  if (isStoreBrand(storeBrand)) {
    return storeBrand;
  }

  return inferStoreBrandFromName(storeName);
}
