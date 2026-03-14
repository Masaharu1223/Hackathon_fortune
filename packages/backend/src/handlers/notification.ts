import type { SQSEvent, SQSRecord } from 'aws-lambda';
import type { NotificationMessage, WatchlistMatchMessage, LotteryResultMessage } from '../services/notification.js';
import { getItem, keys } from '../services/dynamodb.js';
import type { User } from '@ichiban-kuji/shared';

// ---------------------------------------------------------------------------
// Environment variables for notification providers
// ---------------------------------------------------------------------------

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';

// ---------------------------------------------------------------------------
// SQS handler — processes notification messages
// ---------------------------------------------------------------------------

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} notification messages`);

  const errors: Error[] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (err) {
      console.error('Error processing record:', record.messageId, err);
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  if (errors.length > 0) {
    // Throw to trigger partial batch failure handling if configured
    throw new Error(`Failed to process ${errors.length}/${event.Records.length} messages`);
  }
};

// ---------------------------------------------------------------------------
// Record processing
// ---------------------------------------------------------------------------

async function processRecord(record: SQSRecord): Promise<void> {
  const message: NotificationMessage = JSON.parse(record.body);

  console.log('Processing notification:', message.type, 'for user:', message.userId);

  // Fetch user profile for notification preferences
  const user = await getItem<User>(keys.user(message.userId));
  if (!user) {
    console.warn(`User not found: ${message.userId}, skipping notification`);
    return;
  }

  // Send via available channels
  const promises: Promise<void>[] = [];

  if (user.lineUserId && LINE_CHANNEL_ACCESS_TOKEN) {
    promises.push(sendLineMessage(user.lineUserId, message));
  }

  if (user.pushSubscription) {
    promises.push(sendWebPush(user.pushSubscription, message));
  }

  if (promises.length === 0) {
    console.warn(`No notification channels available for user: ${message.userId}`);
    return;
  }

  await Promise.allSettled(promises);
}

// ---------------------------------------------------------------------------
// LINE Messaging API
// ---------------------------------------------------------------------------

async function sendLineMessage(
  lineUserId: string,
  message: NotificationMessage,
): Promise<void> {
  const text = formatMessageText(message);

  const body = {
    to: lineUserId,
    messages: [{ type: 'text', text }],
  };

  const response = await fetch(LINE_MESSAGING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE API error: ${response.status} ${errorBody}`);
  }

  console.log(`LINE message sent to ${lineUserId}`);
}

// ---------------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------------

async function sendWebPush(
  subscriptionJson: string,
  message: NotificationMessage,
): Promise<void> {
  // In a production implementation, you would use the web-push library here.
  // For now, we log the push notification payload.
  const payload = {
    title: getNotificationTitle(message),
    body: formatMessageText(message),
    data: message,
  };

  console.log('Web Push payload:', JSON.stringify(payload));
  console.log('Subscription:', subscriptionJson);

  // TODO: Integrate web-push library
  // const subscription = JSON.parse(subscriptionJson);
  // await webpush.sendNotification(subscription, JSON.stringify(payload));
}

// ---------------------------------------------------------------------------
// Message formatting
// ---------------------------------------------------------------------------

function formatMessageText(message: NotificationMessage): string {
  switch (message.type) {
    case 'watchlist_match':
      return formatWatchlistMatch(message);
    case 'lottery_result':
      return formatLotteryResult(message);
    default:
      return 'You have a new notification.';
  }
}

function formatWatchlistMatch(message: WatchlistMatchMessage): string {
  return (
    `[一番くじ通知]\n` +
    `ウォッチリストの「${message.seriesTitle}」が近くの店舗で取り扱い開始されました！\n` +
    `店舗: ${message.storeName}`
  );
}

function formatLotteryResult(message: LotteryResultMessage): string {
  if (message.result === 'won') {
    return (
      `[一番くじ当選通知]\n` +
      `おめでとうございます！「${message.seriesTitle}」の抽選に当選しました！\n` +
      `当選回数: ${message.drawsWon}回\n` +
      `店舗にてお引き取りください。`
    );
  }
  return (
    `[一番くじ抽選結果]\n` +
    `残念ながら「${message.seriesTitle}」の抽選は落選となりました。\n` +
    `またのご参加をお待ちしております。`
  );
}

function getNotificationTitle(message: NotificationMessage): string {
  switch (message.type) {
    case 'watchlist_match':
      return '一番くじ: 新着取り扱い通知';
    case 'lottery_result':
      return '一番くじ: 抽選結果';
    default:
      return '一番くじ: 通知';
  }
}
