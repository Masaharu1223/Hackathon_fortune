const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
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
  return res.json();
}

// Types
export interface Store {
  store_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km?: number;
  series: KujiSeries[];
}

export interface KujiSeries {
  series_id: string;
  title: string;
  release_date: string;
  end_date?: string;
  total_tickets: number;
  remaining_tickets: number;
  status: 'upcoming' | 'on_sale' | 'sold_out';
  prizes: Prize[];
}

export interface Prize {
  rank: string;
  name: string;
  quantity: number;
  remaining: number;
}

export interface Reservation {
  reservation_id: string;
  store_id: string;
  store_name: string;
  series_id: string;
  series_title: string;
  draw_count: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  created_at: string;
}

export interface WatchlistItem {
  series_id: string;
  title: string;
  release_date: string;
  notification_radius_km: number;
}

export interface UserProfile {
  user_id: string;
  email: string;
  name: string;
}

// API functions
export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>('/profile');
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return request<WatchlistItem[]>('/watchlist');
}

export async function addToWatchlist(
  seriesId: string,
  notificationRadiusKm: number = 5
): Promise<void> {
  return request('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ series_id: seriesId, notification_radius_km: notificationRadiusKm }),
  });
}

export async function removeFromWatchlist(seriesId: string): Promise<void> {
  return request(`/watchlist/${seriesId}`, { method: 'DELETE' });
}

export async function getReservations(): Promise<Reservation[]> {
  return request<Reservation[]>('/reservations');
}

export async function getNearbyStores(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<Store[]> {
  return request<Store[]>(
    `/stores?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`
  );
}

export async function getStore(storeId: string): Promise<Store> {
  return request<Store>(`/stores/${storeId}`);
}

export async function createReservation(
  storeId: string,
  seriesId: string,
  drawCount: number
): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    body: JSON.stringify({
      store_id: storeId,
      series_id: seriesId,
      draw_count: drawCount,
    }),
  });
}

export async function cancelReservation(
  storeId: string,
  seriesId: string
): Promise<void> {
  return request(`/reservations/${storeId}/${seriesId}`, {
    method: 'DELETE',
  });
}
