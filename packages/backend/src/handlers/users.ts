import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  ENTITY_PREFIXES,
  GSI,
  type User,
  type WatchlistItem,
  type Reservation,
  type KujiSeries,
  type Store,
  type ApiResponse,
} from '@ichiban-kuji/shared';
import { keys, getItem, putItem, deleteItem, queryItems, queryByGSI } from '../services/dynamodb.js';

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

// ---------------------------------------------------------------------------
// Extract userId from Cognito authorizer
// ---------------------------------------------------------------------------

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

    // GET /users/me
    if (method === 'GET' && path === '/users/me') {
      return await getMe(userId);
    }

    // GET /users/me/watchlist
    if (method === 'GET' && path === '/users/me/watchlist') {
      return await getWatchlist(userId);
    }

    // POST /users/me/watchlist
    if (method === 'POST' && path === '/users/me/watchlist') {
      return await addWatchlistItem(userId, event);
    }

    // DELETE /users/me/watchlist/{seriesId}
    if (method === 'DELETE' && path === '/users/me/watchlist/{seriesId}') {
      return await removeWatchlistItem(userId, event);
    }

    // GET /users/me/reservations
    if (method === 'GET' && path === '/users/me/reservations') {
      return await getReservations(userId);
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Users handler error:', err);
    return jsonResponse(500, { success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Route implementations
// ---------------------------------------------------------------------------

async function getMe(userId: string): Promise<APIGatewayProxyResult> {
  const user = await getItem<User>(keys.user(userId));
  if (!user) {
    return jsonResponse(404, { success: false, error: 'User not found' });
  }
  return jsonResponse(200, { success: true, data: user });
}

async function getWatchlist(userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryItems<WatchlistItem>({
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `${ENTITY_PREFIXES.USER}${userId}`,
      ':sk': ENTITY_PREFIXES.WATCH,
    },
  });

  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const series = await queryByGSI<KujiSeries & Record<string, unknown>>(
        GSI.GSI2,
        'GSI2PK',
        `${ENTITY_PREFIXES.SERIES}${item.seriesId}`,
      );

      return {
        seriesId: item.seriesId,
        seriesTitle: item.seriesTitle,
        notifyRadius: item.notifyRadius,
        releaseDate: series[0]?.releaseDate,
      };
    }),
  );

  return jsonResponse(200, { success: true, data: enrichedItems });
}

async function addWatchlistItem(
  userId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  const body = JSON.parse(event.body) as Partial<WatchlistItem>;

  if (!body.seriesId || !body.seriesTitle) {
    return jsonResponse(400, { success: false, error: 'seriesId and seriesTitle are required' });
  }

  const watchKeys = keys.watchlist(userId, body.seriesId);
  const now = new Date().toISOString();

  const item: WatchlistItem & Record<string, unknown> = {
    ...watchKeys,
    userId,
    seriesId: body.seriesId,
    seriesTitle: body.seriesTitle,
    notifyRadius: body.notifyRadius ?? 5,
    userLat: body.userLat ?? 0,
    userLng: body.userLng ?? 0,
    createdAt: now,
  };

  await putItem(item);
  return jsonResponse(201, { success: true, data: item });
}

async function removeWatchlistItem(
  userId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const seriesId = event.pathParameters?.seriesId;
  if (!seriesId) {
    return jsonResponse(400, { success: false, error: 'seriesId path parameter is required' });
  }

  const watchKeys = keys.watchlist(userId, seriesId);
  await deleteItem({ PK: watchKeys.PK, SK: watchKeys.SK });
  return jsonResponse(200, { success: true });
}

async function getReservations(userId: string): Promise<APIGatewayProxyResult> {
  const items = await queryByGSI<Reservation & Record<string, unknown>>(
    GSI.GSI3,
    'GSI3PK',
    `${ENTITY_PREFIXES.USER}${userId}`,
  );
const reservations = items.map((item) => {
    return {
      reservationId:
        (item.reservationId as string | undefined) ?? `${item.storeId}:${item.seriesId}:${userId}`,
      storeId: item.storeId,
      storeName: (item.storeName as string | undefined) ?? item.storeId,
      seriesId: item.seriesId,
      seriesTitle: (item.seriesTitle as string | undefined) ?? item.seriesId,
      drawCount: item.drawCount,
      status: item.status,
      createdAt: item.createdAt,
    };
  });

  reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jsonResponse(200, { success: true, data: reservations });
}




     

  reservations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return jsonResponse(200, { success: true, data: reservations });
}
