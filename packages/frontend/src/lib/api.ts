import { normalizeStoreBrand, type StoreBrand } from './storeBrand';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RawStore {
  storeId: string;
  storeName: string;
  storeBrand?: StoreBrand;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  kujiSeries?: RawKujiSeries[];
}

interface RawKujiSeries {
  seriesId: string;
  title: string;
  price: number;
  releaseDate: string;
  totalTickets: number;
  remainingTickets: number;
  status: 'upcoming' | 'on_sale' | 'sold_out';
  prizes: RawPrize[];
}

interface RawPrize {
  rank: string;
  name: string;
  quantity: number;
  remaining?: number;
}

interface RawReservation {
  reservationId?: string;
  storeId: string;
  storeName?: string;
  seriesId: string;
  seriesTitle?: string;
  drawCount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
}

interface RawWatchlistItem {
  seriesId: string;
  seriesTitle: string;
  releaseDate?: string;
  notifyRadius: number;
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Dev mode: send dummy user ID when no real auth
  if (!token) {
    headers['x-dev-user-id'] = 'dev-user-001';
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

function normalizePrize(prize: RawPrize): Prize {
  return {
    rank: prize.rank,
    name: prize.name,
    quantity: prize.quantity,
    remaining: prize.remaining,
  };
}

function normalizeSeries(series: RawKujiSeries): KujiSeries {
  return {
    seriesId: series.seriesId,
    title: series.title,
    price: series.price,
    releaseDate: series.releaseDate,
    totalTickets: series.totalTickets,
    remainingTickets: series.remainingTickets,
    status: series.status,
    prizes: series.prizes.map(normalizePrize),
  };
}

function normalizeStore(store: RawStore): Store {
  return {
    storeId: store.storeId,
    storeName: store.storeName,
    storeBrand: normalizeStoreBrand(store.storeBrand, store.storeName),
    address: store.address,
    lat: store.lat,
    lng: store.lng,
    distanceKm: store.distance,
    series: (store.kujiSeries ?? []).map(normalizeSeries),
  };
}

function normalizeReservation(reservation: RawReservation): Reservation {
  return {
    reservationId:
      reservation.reservationId ??
      `${reservation.storeId}:${reservation.seriesId}:${reservation.createdAt}`,
    storeId: reservation.storeId,
    storeName: reservation.storeName ?? reservation.storeId,
    seriesId: reservation.seriesId,
    seriesTitle: reservation.seriesTitle ?? reservation.seriesId,
    drawCount: reservation.drawCount,
    status: reservation.status,
    createdAt: reservation.createdAt,
  };
}

function normalizeWatchlistItem(item: RawWatchlistItem): WatchlistItem {
  return {
    seriesId: item.seriesId,
    seriesTitle: item.seriesTitle,
    releaseDate: item.releaseDate,
    notifyRadius: item.notifyRadius,
  };
}

// Types
export interface Store {
  storeId: string;
  storeName: string;
  storeBrand: StoreBrand;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  series: KujiSeries[];
}

export interface KujiSeries {
  seriesId: string;
  title: string;
  price: number;
  releaseDate: string;
  totalTickets: number;
  remainingTickets: number;
  status: 'upcoming' | 'on_sale' | 'sold_out';
  prizes: Prize[];
}

export interface Prize {
  rank: string;
  name: string;
  quantity: number;
  remaining?: number;
}

export interface Reservation {
  reservationId: string;
  storeId: string;
  storeName: string;
  seriesId: string;
  seriesTitle: string;
  drawCount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
}

export interface WatchlistItem {
  seriesId: string;
  seriesTitle: string;
  releaseDate?: string;
  notifyRadius: number;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  authProvider: 'google' | 'line';
}

// API functions
export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('/users/me');
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const items = await request<RawWatchlistItem[]>('/users/me/watchlist');
  return items.map(normalizeWatchlistItem);
}

export async function addToWatchlist(
  seriesId: string,
  seriesTitle: string,
  notifyRadius: number = 5,
): Promise<void> {
  return request('/users/me/watchlist', {
    method: 'POST',
    body: JSON.stringify({ seriesId, seriesTitle, notifyRadius }),
  });
}

export async function removeFromWatchlist(seriesId: string): Promise<void> {
  return request(`/users/me/watchlist/${seriesId}`, { method: 'DELETE' });
}

export async function getReservations(): Promise<Reservation[]> {
  const reservations = await request<RawReservation[]>('/users/me/reservations');
  return reservations.map(normalizeReservation);
}

export async function getNearbyStores(
  lat: number,
  lng: number,
  radiusKm: number = 5,
): Promise<Store[]> {
  const response = await request<{ stores: RawStore[] }>(
    `/stores/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
  );
  return response.stores.map(normalizeStore);
}

export async function getStore(storeId: string): Promise<Store> {
  const store = await request<RawStore>(`/stores/${storeId}`);
  return normalizeStore(store);
}

export async function createReservation(
  storeId: string,
  seriesId: string,
  drawCount: number,
): Promise<Reservation> {
  const reservation = await request<RawReservation>(
    `/stores/${storeId}/kuji/${seriesId}/reserve`,
    {
      method: 'POST',
      body: JSON.stringify({ drawCount }),
    },
  );
  return normalizeReservation(reservation);
}

export async function cancelReservation(
  storeId: string,
  seriesId: string,
): Promise<void> {
  return request(`/stores/${storeId}/kuji/${seriesId}/reserve`, {
    method: 'DELETE',
  });
}
