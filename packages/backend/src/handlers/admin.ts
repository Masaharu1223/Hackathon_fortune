import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  ENTITY_PREFIXES,
  type Store,
  type KujiSeries,
  type Reservation,
  type ApiResponse,
} from '@ichiban-kuji/shared';
import { keys, getItem, putItem, updateItem, queryItems } from '../services/dynamodb.js';
import { putStore as geoputStore } from '../services/geo.js';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: ApiResponse): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function normalizePath(event: APIGatewayProxyEvent): string {
  return (event.resource ?? event.path).replace(/^\/api\/v1/, '');
}

function getUserId(event: APIGatewayProxyEvent): string | null {
  return event.requestContext.authorizer?.claims?.sub
    ?? event.headers?.['x-dev-user-id']
    ?? null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }

  try {
    const userId = getUserId(event);
    if (!userId) {
      return jsonResponse(401, { success: false, error: 'Unauthorized' });
    }

    const method = event.httpMethod;
    const path = normalizePath(event);
    const storeId = event.pathParameters?.storeId;
    const seriesId = event.pathParameters?.seriesId;

    // POST /admin/stores — create store
    if (method === 'POST' && path === '/admin/stores') {
      return await createStore(userId, event);
    }

    // PUT /admin/stores/{storeId} — update store
    if (method === 'PUT' && path === '/admin/stores/{storeId}' && storeId) {
      return await updateStore(userId, storeId, event);
    }

    // POST /admin/stores/{storeId}/kuji — create kuji series
    if (method === 'POST' && path === '/admin/stores/{storeId}/kuji' && storeId) {
      return await createKujiSeries(userId, storeId, event);
    }

    // PUT /admin/stores/{storeId}/kuji/{seriesId} — update kuji series
    if (method === 'PUT' && path === '/admin/stores/{storeId}/kuji/{seriesId}' && storeId && seriesId) {
      return await updateKujiSeries(userId, storeId, seriesId, event);
    }

    // GET /admin/stores/{storeId}/kuji/{seriesId}/reservations
    if (method === 'GET' && path === '/admin/stores/{storeId}/kuji/{seriesId}/reservations' && storeId && seriesId) {
      return await getReservations(userId, storeId, seriesId);
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Admin handler error:', err);
    return jsonResponse(500, { success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Route implementations
// ---------------------------------------------------------------------------

async function createStore(
  managerId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  const body = JSON.parse(event.body) as Partial<Store>;

  if (!body.storeName || !body.address || body.lat == null || body.lng == null) {
    return jsonResponse(400, {
      success: false,
      error: 'storeName, address, lat, and lng are required',
    });
  }

  const storeId = uuidv4();
  const now = new Date().toISOString();
  const storeKeys = keys.store(storeId);

  const store: Store & Record<string, unknown> = {
    ...storeKeys,
    storeId,
    storeName: body.storeName,
    address: body.address,
    lat: body.lat,
    lng: body.lng,
    managerId,
    createdAt: now,
    updatedAt: now,
  };

  // Dual-write: main table + geo table
  await Promise.all([
    putItem(store),
    geoputStore({
      storeId,
      storeName: body.storeName,
      address: body.address,
      lat: body.lat,
      lng: body.lng,
      managerId,
      createdAt: now,
      updatedAt: now,
    }),
  ]);

  return jsonResponse(201, { success: true, data: store });
}

async function updateStore(
  managerId: string,
  storeId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  // Verify store exists and belongs to this manager
  const existingStore = await getItem<Store & Record<string, unknown>>(keys.store(storeId));
  if (!existingStore) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }
  if (existingStore.managerId !== managerId) {
    return jsonResponse(403, { success: false, error: 'Not authorized to update this store' });
  }

  const body = JSON.parse(event.body) as Partial<Store>;
  const now = new Date().toISOString();

  const updateExprParts: string[] = ['updatedAt = :now'];
  const exprValues: Record<string, unknown> = { ':now': now };
  const exprNames: Record<string, string> = {};

  if (body.storeName) {
    updateExprParts.push('storeName = :storeName');
    exprValues[':storeName'] = body.storeName;
  }
  if (body.address) {
    updateExprParts.push('#addr = :address');
    exprValues[':address'] = body.address;
    exprNames['#addr'] = 'address';
  }
  if (body.lat != null) {
    updateExprParts.push('lat = :lat');
    exprValues[':lat'] = body.lat;
  }
  if (body.lng != null) {
    updateExprParts.push('lng = :lng');
    exprValues[':lng'] = body.lng;
  }

  const storeKeys = keys.store(storeId);
  const updated = await updateItem(
    storeKeys,
    `SET ${updateExprParts.join(', ')}`,
    exprValues,
    Object.keys(exprNames).length > 0 ? exprNames : undefined,
  );

  // If location changed, also update the geo table
  if (body.lat != null || body.lng != null) {
    const updatedStore: Store = {
      storeId,
      storeName: body.storeName ?? existingStore.storeName,
      address: body.address ?? existingStore.address,
      lat: body.lat ?? existingStore.lat,
      lng: body.lng ?? existingStore.lng,
      managerId,
      createdAt: existingStore.createdAt,
      updatedAt: now,
    };
    await geoputStore(updatedStore);
  }

  return jsonResponse(200, { success: true, data: updated });
}

async function createKujiSeries(
  managerId: string,
  storeId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  // Verify store belongs to this manager
  const store = await getItem<Store & Record<string, unknown>>(keys.store(storeId));
  if (!store) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }
  if (store.managerId !== managerId) {
    return jsonResponse(403, { success: false, error: 'Not authorized to manage this store' });
  }

  const body = JSON.parse(event.body) as Partial<KujiSeries>;

  if (!body.title || body.price == null || !body.releaseDate || !body.totalTickets || !body.prizes) {
    return jsonResponse(400, {
      success: false,
      error: 'title, price, releaseDate, totalTickets, and prizes are required',
    });
  }

  const seriesId = uuidv4();
  const now = new Date().toISOString();
  const seriesKeys = keys.kujiSeries(storeId, seriesId);

  const series: KujiSeries & Record<string, unknown> = {
    ...seriesKeys,
    storeId,
    seriesId,
    title: body.title,
    price: body.price,
    releaseDate: body.releaseDate,
    totalTickets: body.totalTickets,
    remainingTickets: body.remainingTickets ?? body.totalTickets,
    prizes: body.prizes,
    status: body.status ?? 'upcoming',
    createdAt: now,
    updatedAt: now,
  };

  await putItem(series);
  return jsonResponse(201, { success: true, data: series });
}

async function updateKujiSeries(
  managerId: string,
  storeId: string,
  seriesId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  // Verify store belongs to this manager
  const store = await getItem<Store & Record<string, unknown>>(keys.store(storeId));
  if (!store) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }
  if (store.managerId !== managerId) {
    return jsonResponse(403, { success: false, error: 'Not authorized to manage this store' });
  }

  const body = JSON.parse(event.body) as Partial<KujiSeries>;
  const now = new Date().toISOString();

  const updateExprParts: string[] = ['updatedAt = :now'];
  const exprValues: Record<string, unknown> = { ':now': now };
  const exprNames: Record<string, string> = {};

  if (body.title) {
    updateExprParts.push('title = :title');
    exprValues[':title'] = body.title;
  }
  if (body.price != null) {
    updateExprParts.push('price = :price');
    exprValues[':price'] = body.price;
  }
  if (body.releaseDate) {
    updateExprParts.push('releaseDate = :releaseDate');
    exprValues[':releaseDate'] = body.releaseDate;
  }
  if (body.totalTickets != null) {
    updateExprParts.push('totalTickets = :totalTickets');
    exprValues[':totalTickets'] = body.totalTickets;
  }
  if (body.remainingTickets != null) {
    updateExprParts.push('remainingTickets = :remainingTickets');
    exprValues[':remainingTickets'] = body.remainingTickets;
  }
  if (body.prizes) {
    updateExprParts.push('prizes = :prizes');
    exprValues[':prizes'] = body.prizes;
  }
  if (body.status) {
    updateExprParts.push('#st = :status');
    exprValues[':status'] = body.status;
    exprNames['#st'] = 'status';
  }

  const seriesKeys = keys.kujiSeries(storeId, seriesId);
  const updated = await updateItem(
    { PK: seriesKeys.PK, SK: seriesKeys.SK },
    `SET ${updateExprParts.join(', ')}`,
    exprValues,
    Object.keys(exprNames).length > 0 ? exprNames : undefined,
  );

  return jsonResponse(200, { success: true, data: updated });
}

async function getReservations(
  managerId: string,
  storeId: string,
  seriesId: string,
): Promise<APIGatewayProxyResult> {
  // Verify store belongs to this manager
  const store = await getItem<Store & Record<string, unknown>>(keys.store(storeId));
  if (!store) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }
  if (store.managerId !== managerId) {
    return jsonResponse(403, { success: false, error: 'Not authorized to view this store' });
  }

  const reservationPK = `${ENTITY_PREFIXES.STORE}${storeId}#${ENTITY_PREFIXES.KUJI}${seriesId}`;
  const reservations = await queryItems<Reservation>({
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': reservationPK,
      ':sk': ENTITY_PREFIXES.RESERVATION,
    },
  });

  return jsonResponse(200, { success: true, data: reservations });
}
