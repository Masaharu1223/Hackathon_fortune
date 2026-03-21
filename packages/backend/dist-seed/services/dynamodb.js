"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keys = exports.ddbDoc = void 0;
exports.getItem = getItem;
exports.putItem = putItem;
exports.queryItems = queryItems;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.queryByGSI = queryByGSI;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const shared_1 = require("@ichiban-kuji/shared");
// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------
const rawClient = new client_dynamodb_1.DynamoDBClient({});
exports.ddbDoc = lib_dynamodb_1.DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: { removeUndefinedValues: true },
});
// ---------------------------------------------------------------------------
// Key builders
// ---------------------------------------------------------------------------
exports.keys = {
    user(userId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.USER}${userId}`,
            SK: shared_1.ENTITY_PREFIXES.PROFILE,
        };
    },
    watchlist(userId, seriesId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.USER}${userId}`,
            SK: `${shared_1.ENTITY_PREFIXES.WATCH}${seriesId}`,
            GSI1PK: `${shared_1.ENTITY_PREFIXES.SERIES}${seriesId}`,
            GSI1SK: `${shared_1.ENTITY_PREFIXES.WATCH}${userId}`,
        };
    },
    store(storeId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.STORE}${storeId}`,
            SK: shared_1.ENTITY_PREFIXES.PROFILE,
        };
    },
    kujiSeries(storeId, seriesId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.STORE}${storeId}`,
            SK: `${shared_1.ENTITY_PREFIXES.KUJI}${seriesId}`,
            GSI2PK: `${shared_1.ENTITY_PREFIXES.SERIES}${seriesId}`,
            GSI2SK: `${shared_1.ENTITY_PREFIXES.STORE}${storeId}`,
        };
    },
    reservation(storeId, seriesId, userId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.STORE}${storeId}#${shared_1.ENTITY_PREFIXES.KUJI}${seriesId}`,
            SK: `${shared_1.ENTITY_PREFIXES.RESERVATION}${userId}`,
            GSI3PK: `${shared_1.ENTITY_PREFIXES.USER}${userId}`,
            GSI3SK: `${shared_1.ENTITY_PREFIXES.RESERVATION}${storeId}#${seriesId}`,
        };
    },
    lotteryResult(storeId, seriesId, date, userId) {
        return {
            PK: `${shared_1.ENTITY_PREFIXES.STORE}${storeId}#${shared_1.ENTITY_PREFIXES.KUJI}${seriesId}`,
            SK: `${shared_1.ENTITY_PREFIXES.LOTTERY}${date}#${userId}`,
        };
    },
};
// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------
async function getItem(key) {
    const params = {
        TableName: shared_1.TABLE_NAME,
        Key: { PK: key.PK, SK: key.SK },
    };
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.GetCommand(params));
    return result.Item;
}
async function putItem(item, conditionExpression) {
    const params = {
        TableName: shared_1.TABLE_NAME,
        Item: item,
        ...(conditionExpression && { ConditionExpression: conditionExpression }),
    };
    await exports.ddbDoc.send(new lib_dynamodb_1.PutCommand(params));
}
async function queryItems(params) {
    const input = {
        TableName: shared_1.TABLE_NAME,
        ...params,
    };
    const items = [];
    let lastKey;
    do {
        input.ExclusiveStartKey = lastKey;
        const result = await exports.ddbDoc.send(new lib_dynamodb_1.QueryCommand(input));
        if (result.Items) {
            items.push(...result.Items);
        }
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return items;
}
async function updateItem(key, updateExpression, expressionAttributeValues, expressionAttributeNames, conditionExpression) {
    const params = {
        TableName: shared_1.TABLE_NAME,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
        ...(expressionAttributeNames && { ExpressionAttributeNames: expressionAttributeNames }),
        ...(conditionExpression && { ConditionExpression: conditionExpression }),
    };
    const result = await exports.ddbDoc.send(new lib_dynamodb_1.UpdateCommand(params));
    return result.Attributes;
}
async function deleteItem(key) {
    const params = {
        TableName: shared_1.TABLE_NAME,
        Key: key,
    };
    await exports.ddbDoc.send(new lib_dynamodb_1.DeleteCommand(params));
}
async function queryByGSI(indexName, pkName, pkValue, skPrefix) {
    const keyCondition = skPrefix
        ? `${pkName} = :pk AND begins_with(${pkName.replace('PK', 'SK')}, :sk)`
        : `${pkName} = :pk`;
    const expressionValues = { ':pk': pkValue };
    if (skPrefix) {
        expressionValues[':sk'] = skPrefix;
    }
    return queryItems({
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
    });
}
//# sourceMappingURL=dynamodb.js.map