import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  ENTITY_PREFIXES,
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  type Store,
  type KujiSeries,
  type NearbyStoresResponse,
  type ApiResponse,
} from '@ichiban-kuji/shared';
import { keys, getItem, queryItems } from '../services/dynamodb.js';
import { queryNearby } from '../services/geo.js';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: ApiResponse): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }

  try {
    const method = event.httpMethod;
    const path = event.resource ?? event.path;

    // GET /stores/nearby
    if (method === 'GET' && path === '/stores/nearby') {
      return await getNearbyStores(event);
    }

    // GET /stores/{storeId}
    if (method === 'GET' && path === '/stores/{storeId}') {
      return await getStoreWithKuji(event);
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Stores handler error:', err);
    return jsonResponse(500, { success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Route implementations
// ---------------------------------------------------------------------------

async function getNearbyStores(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters;

  const lat = parseFloat(params?.lat ?? '');
  const lng = parseFloat(params?.lng ?? '');
  let radius = parseFloat(params?.radius ?? String(DEFAULT_SEARCH_RADIUS_KM));

  if (isNaN(lat) || isNaN(lng)) {
    return jsonResponse(400, { success: false, error: 'lat and lng query parameters are required' });
  }

  if (isNaN(radius) || radius <= 0) {
    radius = DEFAULT_SEARCH_RADIUS_KM;
  }
  if (radius > MAX_SEARCH_RADIUS_KM) {
    radius = MAX_SEARCH_RADIUS_KM;
  }

  // Query geo table for nearby store IDs
  const nearbyResults = await queryNearby(lat, lng, radius);

  // Fetch full store details and kuji series for each nearby store
  const storesWithKuji = await Promise.all(
    nearbyResults.map(async ({ storeId, distance }) => {
      const store = await getItem<Store>(keys.store(storeId));
      if (!store) return null;

      const kujiSeries = await queryItems<KujiSeries>({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `${ENTITY_PREFIXES.STORE}${storeId}`,
          ':sk': ENTITY_PREFIXES.KUJI,
        },
      });

      return { ...store, distance, kujiSeries };
    }),
  );

  const response: NearbyStoresResponse = {
    stores: storesWithKuji.filter((s): s is NonNullable<typeof s> => s !== null),
  };

  return jsonResponse(200, { success: true, data: response });
}

async function getStoreWithKuji(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const storeId = event.pathParameters?.storeId;
  if (!storeId) {
    return jsonResponse(400, { success: false, error: 'storeId is required' });
  }

  const store = await getItem<Store>(keys.store(storeId));
  if (!store) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }

  const kujiSeries = await queryItems<KujiSeries>({
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${ENTITY_PREFIXES.STORE}${storeId}`,
      ':sk': ENTITY_PREFIXES.KUJI,
    },
  });

  return jsonResponse(200, { success: true, data: { ...store, kujiSeries } });
}
