import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  GeoDataManager,
  GeoDataManagerConfiguration,
  GeoTableUtil,
} from 'dynamodb-geo-v3';
import { GEO_TABLE_NAME, type Store } from '@ichiban-kuji/shared';

// ---------------------------------------------------------------------------
// Geo Data Manager singleton
// ---------------------------------------------------------------------------

const ddbClient = new DynamoDB({});

const geoConfig = new GeoDataManagerConfiguration(ddbClient, GEO_TABLE_NAME);
geoConfig.hashKeyLength = 5;

const geoDataManager = new GeoDataManager(geoConfig);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Insert or update a store in the geo table.
 */
export async function putStore(store: Store): Promise<void> {
  await geoDataManager.putPoint({
    RangeKeyValue: { S: store.storeId },
    GeoPoint: { latitude: store.lat, longitude: store.lng },
    PutItemInput: {
      Item: {
        storeId: { S: store.storeId },
        storeName: { S: store.storeName },
        address: { S: store.address },
        managerId: { S: store.managerId },
      },
    },
  });
}

/**
 * Query stores within a radius (km) of a given point.
 * Returns raw geo query results with distance information.
 */
export async function queryNearby(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Array<{ storeId: string; distance: number }>> {
  const radiusMeters = radiusKm * 1000;

  const result = await geoDataManager.queryRadius({
    RadiusInMeter: radiusMeters,
    CenterPoint: { latitude: lat, longitude: lng },
  });

  return result.map((item) => {
    const storeId = item.storeId?.S ?? '';
    // Calculate approximate distance using Haversine
    const storeLat = parseFloat(item.geoJson?.S ? JSON.parse(item.geoJson.S).coordinates[1] : '0');
    const storeLng = parseFloat(item.geoJson?.S ? JSON.parse(item.geoJson.S).coordinates[0] : '0');
    const distance = haversineKm(lat, lng, storeLat, storeLng);
    return { storeId, distance };
  });
}

// ---------------------------------------------------------------------------
// Haversine helper
// ---------------------------------------------------------------------------

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export { geoDataManager, GeoTableUtil };
