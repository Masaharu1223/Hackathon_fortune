import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { NOTIFICATION_QUEUE_URL } from '@ichiban-kuji/shared';

// ---------------------------------------------------------------------------
// SQS client singleton
// ---------------------------------------------------------------------------

const sqsClient = new SQSClient({});

// ---------------------------------------------------------------------------
// Notification message types
// ---------------------------------------------------------------------------

export interface WatchlistMatchMessage {
  type: 'watchlist_match';
  userId: string;
  seriesId: string;
  seriesTitle: string;
  storeId: string;
  storeName: string;
}

export interface LotteryResultMessage {
  type: 'lottery_result';
  userId: string;
  storeId: string;
  seriesId: string;
  seriesTitle: string;
  result: 'won' | 'lost';
  drawsWon: number;
}

export type NotificationMessage = WatchlistMatchMessage | LotteryResultMessage;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a notification message to the SQS queue for async processing.
 */
export async function sendNotification(
  message: NotificationMessage,
): Promise<void> {
  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: NOTIFICATION_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageGroupId: message.userId,
      MessageDeduplicationId: `${message.type}-${message.userId}-${Date.now()}`,
    }),
  );
}

/**
 * Send multiple notification messages in sequence.
 */
export async function sendNotifications(
  messages: NotificationMessage[],
): Promise<void> {
  for (const message of messages) {
    await sendNotification(message);
  }
}
