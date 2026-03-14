import {
  ENTITY_PREFIXES,
  GSI,
  type KujiSeries,
  type Reservation,
  type LotteryResult,
} from '@ichiban-kuji/shared';
import { keys, queryItems, putItem, updateItem, queryByGSI } from './dynamodb.js';
import { sendNotification, type LotteryResultMessage } from './notification.js';

// ---------------------------------------------------------------------------
// Lottery execution
// ---------------------------------------------------------------------------

/**
 * Run the lottery for all kuji series that are on_sale with releaseDate <= today.
 *
 * Algorithm per series:
 *  1. Find all pending reservations for this series at a given store.
 *  2. Shuffle them randomly.
 *  3. Award wins to shuffled reservations in order until remainingTickets is exhausted.
 *  4. Mark remaining reservations as "lost".
 *  5. Update the kuji series remainingTickets count.
 *  6. Send notification messages for each result.
 */
export async function runLottery(): Promise<{ processed: number; winners: number; losers: number }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Query all kuji series across all stores using GSI2 won't work directly
  // since we need to find all on_sale series. Instead, we scan for series
  // that need lottery processing. In production, you'd use a scheduled status
  // table or DynamoDB streams. Here we query all stores' kuji items.

  // Find all series entries that are on_sale — we query GSI2 for all SERIES# prefixed items.
  // Since we don't know all seriesIds upfront, we rely on the caller (EventBridge)
  // passing a list or we maintain a "lottery queue". For simplicity we scan
  // for KUJI# items with status on_sale by querying each store.
  //
  // In practice, a GSI on status would be ideal. Here we use a targeted approach:
  // Query all items whose SK begins with KUJI# across stores.
  // We'll use a secondary approach: query the GSI2 for known series.

  // Pragmatic approach: Query all items with SK beginning with KUJI# (series items)
  // by scanning. For a production system, add a GSI on status.
  const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  const { ddbDoc } = await import('./dynamodb.js');
  const { TABLE_NAME } = await import('@ichiban-kuji/shared');

  const onSaleSeries: Array<KujiSeries & { PK: string; SK: string }> = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddbDoc.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(SK, :skPrefix) AND #st = :status AND releaseDate <= :today',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':skPrefix': ENTITY_PREFIXES.KUJI,
        ':status': 'on_sale',
        ':today': today,
      },
      ExclusiveStartKey: lastKey,
    }));

    if (result.Items) {
      onSaleSeries.push(...(result.Items as Array<KujiSeries & { PK: string; SK: string }>));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  let processed = 0;
  let totalWinners = 0;
  let totalLosers = 0;

  for (const series of onSaleSeries) {
    const storeId = series.storeId;
    const seriesId = series.seriesId;
    let remainingTickets = series.remainingTickets;

    if (remainingTickets <= 0) continue;

    // Query pending reservations for this store+series combination
    const reservationPK = `${ENTITY_PREFIXES.STORE}${storeId}#${ENTITY_PREFIXES.KUJI}${seriesId}`;
    const pendingReservations = await queryItems<Reservation & { PK: string; SK: string }>({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#st = :pending',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':pk': reservationPK,
        ':sk': ENTITY_PREFIXES.RESERVATION,
        ':pending': 'pending',
      },
    });

    if (pendingReservations.length === 0) continue;

    // Shuffle reservations (Fisher-Yates)
    const shuffled = [...pendingReservations];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const now = new Date().toISOString();

    for (const reservation of shuffled) {
      const userId = reservation.userId;
      const drawCount = reservation.drawCount;
      let drawsWon = 0;
      let resultStatus: 'won' | 'lost';

      if (remainingTickets >= drawCount) {
        // Full win
        drawsWon = drawCount;
        remainingTickets -= drawCount;
        resultStatus = 'won';
      } else if (remainingTickets > 0) {
        // Partial win — award remaining tickets
        drawsWon = remainingTickets;
        remainingTickets = 0;
        resultStatus = 'won';
      } else {
        // No tickets left
        drawsWon = 0;
        resultStatus = 'lost';
      }

      // Update reservation status
      const resKeys = keys.reservation(storeId, seriesId, userId);
      await updateItem(
        { PK: resKeys.PK, SK: resKeys.SK },
        'SET #st = :status, updatedAt = :now',
        { ':status': resultStatus, ':now': now },
        { '#st': 'status' },
      );

      // Write lottery result
      const lotteryKeys = keys.lotteryResult(storeId, seriesId, today, userId);
      const lotteryResult: LotteryResult & Record<string, unknown> = {
        ...lotteryKeys,
        storeId,
        seriesId,
        userId,
        date: today,
        result: resultStatus,
        drawsWon,
      };
      await putItem(lotteryResult);

      // Send notification
      const notificationMessage: LotteryResultMessage = {
        type: 'lottery_result',
        userId,
        storeId,
        seriesId,
        seriesTitle: series.title,
        result: resultStatus,
        drawsWon,
      };
      await sendNotification(notificationMessage);

      if (resultStatus === 'won') {
        totalWinners++;
      } else {
        totalLosers++;
      }
    }

    // Update kuji series remaining tickets
    const seriesKeys = keys.kujiSeries(storeId, seriesId);
    const newStatus = remainingTickets <= 0 ? 'sold_out' : 'on_sale';
    await updateItem(
      { PK: seriesKeys.PK, SK: seriesKeys.SK },
      'SET remainingTickets = :remaining, #st = :status, updatedAt = :now',
      { ':remaining': remainingTickets, ':status': newStatus, ':now': now },
      { '#st': 'status' },
    );

    processed++;
  }

  return { processed, winners: totalWinners, losers: totalLosers };
}
