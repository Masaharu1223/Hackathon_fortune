const STORAGE_KEY = 'my_stores';

export function getMyStores(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMyStore(storeId: string): void {
  const stores = getMyStores();
  if (!stores.includes(storeId)) {
    stores.push(storeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
  }
}

export function removeMyStore(storeId: string): void {
  const stores = getMyStores().filter((id) => id !== storeId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

export function isMyStore(storeId: string): boolean {
  return getMyStores().includes(storeId);
}
