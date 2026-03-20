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
 *  2. Create a lottery pool where each entry represents a single ticket draw.
 *  3. Shuffle the pool randomly (Fisher-Yates).
 *  4. Award wins to the first N entries from the pool, where N is the remaining tickets.
 *  5. Mark reservations as "won" if they have 1+ wins, else "lost".
 *  6. Update the kuji series remainingTickets count.
 *  7. Send notification messages for each result.
 */
export async function runLottery(): Promise<{ processed: number; winners: number; losers: number }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
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
    const remainingTickets = series.remainingTickets;

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

    // 1. Create a lottery pool where each entry is a single ticket draw for a user
    const lotteryPool: string[] = [];
    for (const res of pendingReservations) {
      for (let i = 0; i < res.drawCount; i++) {
        lotteryPool.push(res.userId);
      }
    }

    // 2. Shuffle the lottery pool (Fisher-Yates)
    for (let i = lotteryPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lotteryPool[i], lotteryPool[j]] = [lotteryPool[j], lotteryPool[i]];
    }

    // 3. Determine winners based on remaining tickets
    const totalDrawn = Math.min(lotteryPool.length, remainingTickets);
    const winningTickets = lotteryPool.slice(0, totalDrawn);

    // Count wins per user
    const winCounts = new Map<string, number>();
    for (const userId of winningTickets) {
      winCounts.set(userId, (winCounts.get(userId) || 0) + 1);
    }

    const now = new Date().toISOString();
    let seriesWinners = 0;
    let seriesLosers = 0;

    // 4. Update data for each reservation
    for (const reservation of pendingReservations) {
      const userId = reservation.userId;
      const drawsWon = winCounts.get(userId) || 0;
      const resultStatus: 'won' | 'lost' = drawsWon > 0 ? 'won' : 'lost';

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
        seriesWinners++;
      } else {
        seriesLosers++;
      }
    }

    // Update kuji series remaining tickets
    const newRemainingTickets = Math.max(0, remainingTickets - totalDrawn);
    const seriesKeys = keys.kujiSeries(storeId, seriesId);
    const newStatus = newRemainingTickets <= 0 ? 'sold_out' : 'on_sale';
    await updateItem(
      { PK: seriesKeys.PK, SK: seriesKeys.SK },
      'SET remainingTickets = :remaining, #st = :status, updatedAt = :now',
      { ':remaining': newRemainingTickets, ':status': newStatus, ':now': now },
      { '#st': 'status' },
    );

    totalWinners += seriesWinners;
    totalLosers += seriesLosers;
    processed++;
  }

  return { processed, winners: totalWinners, losers: totalLosers };
}
