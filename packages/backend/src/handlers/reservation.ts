import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  MAX_DRAWS_PER_RESERVATION,
  type Reservation,
  type ReservationRequest,
  type KujiSeries,
  type Store,
  type ApiResponse,
} from '@ichiban-kuji/shared';
import { keys, getItem, putItem, updateItem } from '../services/dynamodb.js';

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(statusCode: number, body: ApiResponse): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function getUserId(event: APIGatewayProxyEvent): string | null {
  return event.requestContext.authorizer?.claims?.sub ?? null;
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

    const storeId = event.pathParameters?.storeId;
    const seriesId = event.pathParameters?.seriesId;

    if (!storeId || !seriesId) {
      return jsonResponse(400, { success: false, error: 'storeId and seriesId are required' });
    }

    const method = event.httpMethod;

    if (method === 'POST') {
      return await createReservation(userId, storeId, seriesId, event);
    }

    if (method === 'DELETE') {
      return await cancelReservation(userId, storeId, seriesId);
    }

    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Reservation handler error:', err);
    return jsonResponse(500, { success: false, error: 'Internal server error' });
  }
};

// ---------------------------------------------------------------------------
// Route implementations
// ---------------------------------------------------------------------------

async function createReservation(
  userId: string,
  storeId: string,
  seriesId: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Request body is required' });
  }

  const body = JSON.parse(event.body) as ReservationRequest;
  const drawCount = body.drawCount;

  // Validate drawCount
  if (!drawCount || drawCount < 1 || drawCount > MAX_DRAWS_PER_RESERVATION) {
    return jsonResponse(400, {
      success: false,
      error: `drawCount must be between 1 and ${MAX_DRAWS_PER_RESERVATION}`,
    });
  }

  // Check kuji series exists and is available
  const seriesKeys = keys.kujiSeries(storeId, seriesId);
  const series = await getItem<KujiSeries & Record<string, unknown>>(seriesKeys);

  if (!series) {
    return jsonResponse(404, { success: false, error: 'Kuji series not found' });
  }

  if (series.status !== 'on_sale' && series.status !== 'upcoming') {
    return jsonResponse(400, { success: false, error: 'Kuji series is not available for reservation' });
  }

  if (series.remainingTickets <= 0) {
    return jsonResponse(400, { success: false, error: 'Kuji series is sold out' });
  }

  // Check for existing pending reservation
  const resKeys = keys.reservation(storeId, seriesId, userId);
  const existing = await getItem<Reservation & Record<string, unknown>>({
    PK: resKeys.PK,
    SK: resKeys.SK,
  });

  if (existing && existing.status === 'pending') {
    return jsonResponse(409, { success: false, error: 'You already have a pending reservation for this series' });
  }

  // Create reservation
  const store = await getItem<Store & Record<string, unknown>>(keys.store(storeId));
  if (!store) {
    return jsonResponse(404, { success: false, error: 'Store not found' });
  }

  // Reservation only records the user's entry; inventory is consumed during the lottery run.
  const now = new Date().toISOString();
  const reservationId = `${storeId}:${seriesId}:${userId}`;
  const reservation: Reservation & Record<string, unknown> = {
    ...resKeys,
    reservationId,
    storeId,
    storeName: store.storeName,
    seriesId,
    seriesTitle: series.title,
    userId,
    drawCount,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await putItem(reservation);

  return jsonResponse(201, { success: true, data: reservation });
}

async function cancelReservation(
  userId: string,
  storeId: string,
  seriesId: string,
): Promise<APIGatewayProxyResult> {
  const resKeys = keys.reservation(storeId, seriesId, userId);
  const existing = await getItem<Reservation & Record<string, unknown>>({
    PK: resKeys.PK,
    SK: resKeys.SK,
  });

  if (!existing) {
    return jsonResponse(404, { success: false, error: 'Reservation not found' });
  }

  if (existing.status !== 'pending') {
    return jsonResponse(400, { success: false, error: 'Only pending reservations can be cancelled' });
  }

  const now = new Date().toISOString();
  await updateItem(
    { PK: resKeys.PK, SK: resKeys.SK },
    'SET #st = :status, updatedAt = :now',
    { ':status': 'cancelled', ':now': now },
    { '#st': 'status' },
  );

  return jsonResponse(200, { success: true });
}
