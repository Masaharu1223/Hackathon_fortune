// === Entity Types ===

export interface User {
  userId: string;
  displayName: string;
  authProvider: 'google' | 'line';
  lineUserId?: string;
  pushSubscription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  storeId: string;
  storeName: string;
  address: string;
  lat: number;
  lng: number;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KujiSeries {
  storeId: string;
  seriesId: string;
  title: string;
  price: number;
  releaseDate: string;
  totalTickets: number;
  remainingTickets: number;
  prizes: Prize[];
  status: 'upcoming' | 'on_sale' | 'sold_out';
  createdAt: string;
  updatedAt: string;
}

export interface Prize {
  rank: string; // e.g. "A賞", "B賞", "ラストワン賞"
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface WatchlistItem {
  userId: string;
  seriesId: string;
  seriesTitle: string;
  releaseDate?: string;
  notifyRadius: number; // km
  userLat: number;
  userLng: number;
  createdAt: string;
}

export interface Reservation {
  reservationId?: string;
  storeId: string;
  storeName?: string;
  seriesId: string;
  seriesTitle?: string;
  userId: string;
  drawCount: 1 | 2 | 3;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface LotteryResult {
  storeId: string;
  seriesId: string;
  userId: string;
  date: string;
  result: 'won' | 'lost';
  drawsWon: number;
}

// === API Request/Response Types ===

export interface NearbyStoresRequest {
  lat: number;
  lng: number;
  radius: number; // km
}

export interface NearbyStoresResponse {
  stores: (Store & { distance: number; kujiSeries: KujiSeries[] })[];
}

export interface ReservationRequest {
  drawCount: 1 | 2 | 3;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// === DynamoDB Key Patterns ===

export interface DynamoDBKeys {
  PK: string;
  SK: string;
}
