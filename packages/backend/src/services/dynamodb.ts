import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  type GetCommandInput,
  type PutCommandInput,
  type QueryCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import {
  TABLE_NAME,
  ENTITY_PREFIXES,
  GSI,
  type DynamoDBKeys,
} from '@ichiban-kuji/shared';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

const rawClient = new DynamoDBClient({});
export const ddbDoc = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ---------------------------------------------------------------------------
// Key builders
// ---------------------------------------------------------------------------

export const keys = {
  user(userId: string): DynamoDBKeys {
    return {
      PK: `${ENTITY_PREFIXES.USER}${userId}`,
      SK: ENTITY_PREFIXES.PROFILE,
    };
  },

  watchlist(userId: string, seriesId: string): DynamoDBKeys & { GSI1PK: string; GSI1SK: string } {
    return {
      PK: `${ENTITY_PREFIXES.USER}${userId}`,
      SK: `${ENTITY_PREFIXES.WATCH}${seriesId}`,
      GSI1PK: `${ENTITY_PREFIXES.SERIES}${seriesId}`,
      GSI1SK: `${ENTITY_PREFIXES.WATCH}${userId}`,
    };
  },

  store(storeId: string): DynamoDBKeys {
    return {
      PK: `${ENTITY_PREFIXES.STORE}${storeId}`,
      SK: ENTITY_PREFIXES.PROFILE,
    };
  },

  kujiSeries(storeId: string, seriesId: string): DynamoDBKeys & { GSI2PK: string; GSI2SK: string } {
    return {
      PK: `${ENTITY_PREFIXES.STORE}${storeId}`,
      SK: `${ENTITY_PREFIXES.KUJI}${seriesId}`,
      GSI2PK: `${ENTITY_PREFIXES.SERIES}${seriesId}`,
      GSI2SK: `${ENTITY_PREFIXES.STORE}${storeId}`,
    };
  },

  reservation(storeId: string, seriesId: string, userId: string): DynamoDBKeys & { GSI3PK: string; GSI3SK: string } {
    return {
      PK: `${ENTITY_PREFIXES.STORE}${storeId}#${ENTITY_PREFIXES.KUJI}${seriesId}`,
      SK: `${ENTITY_PREFIXES.RESERVATION}${userId}`,
      GSI3PK: `${ENTITY_PREFIXES.USER}${userId}`,
      GSI3SK: `${ENTITY_PREFIXES.RESERVATION}${storeId}#${seriesId}`,
    };
  },

  lotteryResult(storeId: string, seriesId: string, date: string, userId: string): DynamoDBKeys {
    return {
      PK: `${ENTITY_PREFIXES.STORE}${storeId}#${ENTITY_PREFIXES.KUJI}${seriesId}`,
      SK: `${ENTITY_PREFIXES.LOTTERY}${date}#${userId}`,
    };
  },
} as const;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

export async function getItem<T = Record<string, unknown>>(
  key: DynamoDBKeys,
): Promise<T | undefined> {
  const params: GetCommandInput = {
    TableName: TABLE_NAME,
    Key: { PK: key.PK, SK: key.SK },
  };
  const result = await ddbDoc.send(new GetCommand(params));
  return result.Item as T | undefined;
}

export async function putItem(
  item: Record<string, unknown>,
  conditionExpression?: string,
): Promise<void> {
  const params: PutCommandInput = {
    TableName: TABLE_NAME,
    Item: item,
    ...(conditionExpression && { ConditionExpression: conditionExpression }),
  };
  await ddbDoc.send(new PutCommand(params));
}

export async function queryItems<T = Record<string, unknown>>(
  params: Omit<QueryCommandInput, 'TableName'>,
): Promise<T[]> {
  const input: QueryCommandInput = {
    TableName: TABLE_NAME,
    ...params,
  };
  const items: T[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    input.ExclusiveStartKey = lastKey;
    const result = await ddbDoc.send(new QueryCommand(input));
    if (result.Items) {
      items.push(...(result.Items as T[]));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

export async function updateItem(
  key: DynamoDBKeys,
  updateExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>,
  conditionExpression?: string,
): Promise<Record<string, unknown> | undefined> {
  const params: UpdateCommandInput = {
    TableName: TABLE_NAME,
    Key: { PK: key.PK, SK: key.SK },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
    ...(expressionAttributeNames && { ExpressionAttributeNames: expressionAttributeNames }),
    ...(conditionExpression && { ConditionExpression: conditionExpression }),
  };
  const result = await ddbDoc.send(new UpdateCommand(params));
  return result.Attributes;
}

export async function deleteItem(key: DynamoDBKeys): Promise<void> {
  const params: DeleteCommandInput = {
    TableName: TABLE_NAME,
    Key: { PK: key.PK, SK: key.SK },
  };
  await ddbDoc.send(new DeleteCommand(params));
}

export async function queryByGSI<T = Record<string, unknown>>(
  indexName: string,
  pkName: string,
  pkValue: string,
  skPrefix?: string,
): Promise<T[]> {
  const keyCondition = skPrefix
    ? `${pkName} = :pk AND begins_with(${pkName.replace('PK', 'SK')}, :sk)`
    : `${pkName} = :pk`;

  const expressionValues: Record<string, string> = { ':pk': pkValue };
  if (skPrefix) {
    expressionValues[':sk'] = skPrefix;
  }

  return queryItems<T>({
    IndexName: indexName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
  });
}
