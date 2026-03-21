import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForSuggestionsCommand,
  SearchPlaceIndexForPositionCommand,
} from '@aws-sdk/client-location';
import { LOCATION_PLACE_INDEX_NAME } from '@ichiban-kuji/shared';

// ---------------------------------------------------------------------------
// Location Client singleton
// ---------------------------------------------------------------------------

const client = new LocationClient({});

// ---------------------------------------------------------------------------
// Geocoding: 住所 → 座標
// ---------------------------------------------------------------------------

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

/**
 * 住所テキストから座標を取得する。
 * 日本国内に限定して検索する。
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const command = new SearchPlaceIndexForTextCommand({
    IndexName: LOCATION_PLACE_INDEX_NAME,
    Text: address,
    FilterCountries: ['JPN'],
    MaxResults: 1,
    Language: 'ja',
  });

  const response = await client.send(command);
  const place = response.Results?.[0]?.Place;

  if (!place?.Geometry?.Point) return null;

  const [lng, lat] = place.Geometry.Point;
  return {
    lat,
    lng,
    label: place.Label ?? address,
  };
}

// ---------------------------------------------------------------------------
// 住所サジェスト: オートコンプリート用
// ---------------------------------------------------------------------------

export interface SuggestionResult {
  text: string;
  placeId?: string;
}

/**
 * 入力途中の住所テキストから候補を返す。
 */
export async function suggestAddresses(
  text: string,
  biasLat?: number,
  biasLng?: number,
): Promise<SuggestionResult[]> {
  const command = new SearchPlaceIndexForSuggestionsCommand({
    IndexName: LOCATION_PLACE_INDEX_NAME,
    Text: text,
    FilterCountries: ['JPN'],
    MaxResults: 5,
    Language: 'ja',
    ...(biasLat != null && biasLng != null
      ? { BiasPosition: [biasLng, biasLat] }
      : {}),
  });

  const response = await client.send(command);

  return (response.Results ?? []).map((r) => ({
    text: r.Text ?? '',
    placeId: r.PlaceId,
  }));
}

// ---------------------------------------------------------------------------
// 逆ジオコーディング: 座標 → 住所
// ---------------------------------------------------------------------------

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const command = new SearchPlaceIndexForPositionCommand({
    IndexName: LOCATION_PLACE_INDEX_NAME,
    Position: [lng, lat],
    MaxResults: 1,
    Language: 'ja',
  });

  const response = await client.send(command);
  return response.Results?.[0]?.Place?.Label ?? null;
}
