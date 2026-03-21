import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DynamoDBKeys, KujiSeries, Store } from '@ichiban-kuji/shared';
import {
  DEFAULT_SEED_REGION,
  seedStoreRegions,
  type SeedStoreFixture,
} from './fixtures/devStoreRegions.js';
import { resolveStoreBrand } from '../utils/storeBrand.js';

const ENV_FILE_PATH = path.resolve(__dirname, '../../.env.local');

if (existsSync(ENV_FILE_PATH)) {
  process.loadEnvFile(ENV_FILE_PATH);
}

function requireEnv(name: 'TABLE_NAME' | 'GEO_TABLE_NAME'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required. Set stack table names before running the seed.`);
  }
  return value;
}

function getRegionId(): string {
  const regionArgIndex = process.argv.findIndex((arg) => arg === '--region');
  if (regionArgIndex >= 0) {
    return process.argv[regionArgIndex + 1] ?? DEFAULT_SEED_REGION;
  }
  return process.env.SEED_REGION ?? DEFAULT_SEED_REGION;
}

async function seedStore(
  storeFixture: SeedStoreFixture,
  managerId: string,
  timestamp: string,
  seedDeps: {
    keys: {
      store(storeId: string): DynamoDBKeys;
      kujiSeries(storeId: string, seriesId: string): DynamoDBKeys;
    };
    putItem(item: Record<string, unknown>): Promise<void>;
    putStore(store: Store): Promise<void>;
  },
): Promise<number> {
  const storeBrand = resolveStoreBrand(storeFixture.storeBrand, storeFixture.storeName);
  const storeItem: Store & Record<string, unknown> = {
    ...seedDeps.keys.store(storeFixture.storeId),
    storeId: storeFixture.storeId,
    storeName: storeFixture.storeName,
    storeBrand,
    address: storeFixture.address,
    lat: storeFixture.lat,
    lng: storeFixture.lng,
    managerId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await Promise.all([
    seedDeps.putItem(storeItem),
    seedDeps.putStore({
      storeId: storeFixture.storeId,
      storeName: storeFixture.storeName,
      storeBrand,
      address: storeFixture.address,
      lat: storeFixture.lat,
      lng: storeFixture.lng,
      managerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  ]);

  for (const seriesFixture of storeFixture.kujiSeries) {
    const seriesItem: KujiSeries & Record<string, unknown> = {
      ...seedDeps.keys.kujiSeries(storeFixture.storeId, seriesFixture.seriesId),
      storeId: storeFixture.storeId,
      seriesId: seriesFixture.seriesId,
      title: seriesFixture.title,
      price: seriesFixture.price,
      releaseDate: seriesFixture.releaseDate,
      totalTickets: seriesFixture.totalTickets,
      remainingTickets: seriesFixture.remainingTickets,
      prizes: seriesFixture.prizes,
      status: seriesFixture.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await seedDeps.putItem(seriesItem);
  }

  return storeFixture.kujiSeries.length;
}

async function main(): Promise<void> {
  const [{ keys, putItem }, { putStore }] =
    await Promise.all([
      import('../services/dynamodb.js'),
      import('../services/geo.js'),
    ]);

  const tableName = requireEnv('TABLE_NAME');
  const geoTableName = requireEnv('GEO_TABLE_NAME');
  const regionId = getRegionId();
  const region = seedStoreRegions[regionId];

  if (!region) {
    throw new Error(
      `Unknown region "${regionId}". Available regions: ${Object.keys(seedStoreRegions).join(', ')}`,
    );
  }

  const timestamp = new Date().toISOString();
  let seriesCount = 0;

  console.log(`Seeding region: ${region.label} (${regionId})`);
  console.log(`Main table: ${tableName}`);
  console.log(`Geo table: ${geoTableName}`);

  for (const storeFixture of region.stores) {
    const seededSeriesCount = await seedStore(storeFixture, region.managerId, timestamp, {
      keys,
      putItem,
      putStore,
    });
    seriesCount += seededSeriesCount;
    console.log(
      `Seeded ${storeFixture.storeName} (${storeFixture.storeId}) with ${seededSeriesCount} series.`,
    );
  }

  console.log(
    `Completed seed for ${region.stores.length} stores and ${seriesCount} series in ${region.label}.`,
  );
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
