import { existsSync } from 'node:fs';
import path from 'node:path';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Store, StoreBrand } from '@ichiban-kuji/shared';
import { inferStoreBrandFromName, isStoreBrand } from '../utils/storeBrand.js';

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env.local');

if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

interface StoredStore extends Omit<Store, 'storeBrand'> {
  PK: string;
  SK: string;
  storeBrand?: StoreBrand;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function requireEnv(name: 'TABLE_NAME' | 'GEO_TABLE_NAME'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Set stack table names before running the backfill.`);
  }
  return value;
}

async function scanStores(
  tableName: string,
  entityPrefixes: { PROFILE: string; STORE: string },
  ddbDoc: { send(command: ScanCommand): Promise<{ Items?: Record<string, unknown>[]; LastEvaluatedKey?: Record<string, unknown> }> },
): Promise<StoredStore[]> {
  const stores: StoredStore[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await ddbDoc.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'SK = :profile AND begins_with(PK, :storePrefix)',
      ExpressionAttributeValues: {
        ':profile': entityPrefixes.PROFILE,
        ':storePrefix': entityPrefixes.STORE,
      },
      ExclusiveStartKey: lastKey,
    }));

    if (result.Items) {
      stores.push(...(result.Items as unknown as StoredStore[]));
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return stores;
}

async function main(): Promise<void> {
  const dryRun = hasFlag('--dry-run');
  const force = hasFlag('--force');
  const tableName = requireEnv('TABLE_NAME');
  requireEnv('GEO_TABLE_NAME');

  const [
    { ENTITY_PREFIXES },
    { ddbDoc, updateItem },
    { putStore: putGeoStoreAfterEnv },
  ] = await Promise.all([
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
    const inferredBrand = inferStoreBrandFromName(store.storeName);
    const hasStoredBrand = isStoreBrand(storedBrand);
    let nextBrand: StoreBrand = inferredBrand;

    if (!force && hasStoredBrand) {
      nextBrand = storedBrand;
    }

    if (hasStoredBrand && !force) {
      skippedCount++;
      console.log(`SKIP ${store.storeId} ${store.storeName} -> ${storedBrand}`);
      continue;
    }

    console.log(
      `${dryRun ? 'PLAN' : 'UPDATE'} ${store.storeId} ${store.storeName}: ${storedBrand ?? '(empty)'} -> ${nextBrand}`,
    );

    if (!dryRun) {
      await updateItem(
        { PK: store.PK, SK: store.SK },
        'SET storeBrand = :storeBrand, updatedAt = :updatedAt',
        {
          ':storeBrand': nextBrand,
          ':updatedAt': new Date().toISOString(),
        },
      );

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

main().catch((error: unknown) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});
