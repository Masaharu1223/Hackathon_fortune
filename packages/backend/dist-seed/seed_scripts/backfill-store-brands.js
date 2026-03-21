"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const storeBrand_js_1 = require("../utils/storeBrand.js");
const ENV_FILE_PATH = node_path_1.default.resolve(__dirname, '../../.env.local');
if ((0, node_fs_1.existsSync)(ENV_FILE_PATH)) {
    process.loadEnvFile(ENV_FILE_PATH);
}
function hasFlag(flag) {
    return process.argv.includes(flag);
}
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required. Set stack table names before running the backfill.`);
    }
    return value;
}
async function scanStores(tableName, entityPrefixes, ddbDoc) {
    const stores = [];
    let lastKey;
    do {
        const result = await ddbDoc.send(new lib_dynamodb_1.ScanCommand({
            TableName: tableName,
            FilterExpression: 'SK = :profile AND begins_with(PK, :storePrefix)',
            ExpressionAttributeValues: {
                ':profile': entityPrefixes.PROFILE,
                ':storePrefix': entityPrefixes.STORE,
            },
            ExclusiveStartKey: lastKey,
        }));
        if (result.Items) {
            stores.push(...result.Items);
        }
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return stores;
}
async function main() {
    const dryRun = hasFlag('--dry-run');
    const force = hasFlag('--force');
    const tableName = requireEnv('TABLE_NAME');
    requireEnv('GEO_TABLE_NAME');
    const [{ ENTITY_PREFIXES }, { ddbDoc, updateItem }, { putStore: putGeoStoreAfterEnv },] = await Promise.all([
        import('@ichiban-kuji/shared'),
        import('../services/dynamodb.js'),
        import('../services/geo.js'),
    ]);
    const stores = await scanStores(tableName, ENTITY_PREFIXES, ddbDoc);
    let updatedCount = 0;
    let skippedCount = 0;
    console.log(`Found ${stores.length} stores in ${tableName}.`);
    console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}${force ? ' + force' : ''}`);
    for (const store of stores) {
        const storedBrand = store.storeBrand;
        const inferredBrand = (0, storeBrand_js_1.inferStoreBrandFromName)(store.storeName);
        const hasStoredBrand = (0, storeBrand_js_1.isStoreBrand)(storedBrand);
        let nextBrand = inferredBrand;
        if (!force && hasStoredBrand) {
            nextBrand = storedBrand;
        }
        if (hasStoredBrand && !force) {
            skippedCount++;
            console.log(`SKIP ${store.storeId} ${store.storeName} -> ${storedBrand}`);
            continue;
        }
        console.log(`${dryRun ? 'PLAN' : 'UPDATE'} ${store.storeId} ${store.storeName}: ${storedBrand ?? '(empty)'} -> ${nextBrand}`);
        if (!dryRun) {
            await updateItem({ PK: store.PK, SK: store.SK }, 'SET storeBrand = :storeBrand, updatedAt = :updatedAt', {
                ':storeBrand': nextBrand,
                ':updatedAt': new Date().toISOString(),
            });
            await putGeoStoreAfterEnv({
                storeId: store.storeId,
                storeName: store.storeName,
                storeBrand: nextBrand,
                address: store.address,
                lat: store.lat,
                lng: store.lng,
                managerId: store.managerId,
                createdAt: store.createdAt,
                updatedAt: new Date().toISOString(),
            });
        }
        updatedCount++;
    }
    console.log(`Completed. updated=${updatedCount} skipped=${skippedCount} dryRun=${dryRun}`);
    console.log('Brand mapping: lawson/familymart/seven-eleven/other');
}
main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
});
//# sourceMappingURL=backfill-store-brands.js.map