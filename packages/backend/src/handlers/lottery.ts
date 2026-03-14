import type { EventBridgeEvent } from 'aws-lambda';
import { runLottery } from '../services/lottery.js';

// ---------------------------------------------------------------------------
// EventBridge scheduled handler — runs lottery processing
// ---------------------------------------------------------------------------

export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', Record<string, unknown>>,
): Promise<void> => {
  console.log('Lottery handler triggered:', JSON.stringify(event));

  try {
    const result = await runLottery();

    console.log('Lottery processing complete:', JSON.stringify(result));
    console.log(
      `Processed ${result.processed} series, ${result.winners} winners, ${result.losers} losers`,
    );
  } catch (err) {
    console.error('Lottery handler error:', err);
    throw err; // Rethrow so EventBridge can track failure
  }
};
