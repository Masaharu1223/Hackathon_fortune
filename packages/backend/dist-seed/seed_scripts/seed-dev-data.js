"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const devStoreRegions_js_1 = require("./fixtures/devStoreRegions.js");
const storeBrand_js_1 = require("../utils/storeBrand.js");
const ENV_FILE_PATH = node_path_1.default.resolve(__dirname, '../../.env.local');
if ((0, node_fs_1.existsSync)(ENV_FILE_PATH)) {
    process.loadEnvFile(ENV_FILE_PATH);
}
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required. Set stack table names before running the seed.`);
    }
    return value;
}
function getRegionId() {
    const regionArgIndex = process.argv.findIndex((arg) => arg === '--region');
    if (regionArgIndex >= 0) {
        return process.argv[regionArgIndex + 1] ?? devStoreRegions_js_1.DEFAULT_SEED_REGION;
    }
    return process.env.SEED_REGION ?? devStoreRegions_js_1.DEFAULT_SEED_REGION;
}
async function seedStore(storeFixture, managerId, timestamp, seedDeps) {
    const storeBrand = (0, storeBrand_js_1.resolveStoreBrand)(storeFixture.storeBrand, storeFixture.storeName);
    const storeItem = {
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
        const seriesItem = {
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
async function main() {
    const [{ keys, putItem }, { putStore }] = await Promise.all([
        import('../services/dynamodb.js'),
        import('../services/geo.js'),
    ]);
    const tableName = requireEnv('TABLE_NAME');
    const geoTableName = requireEnv('GEO_TABLE_NAME');
    const regionId = getRegionId();
    const region = devStoreRegions_js_1.seedStoreRegions[regionId];
    if (!region) {
        throw new Error(`Unknown region "${regionId}". Available regions: ${Object.keys(devStoreRegions_js_1.seedStoreRegions).join(', ')}`);
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
        console.log(`Seeded ${storeFixture.storeName} (${storeFixture.storeId}) with ${seededSeriesCount} series.`);
    }
    console.log(`Completed seed for ${region.stores.length} stores and ${seriesCount} series in ${region.label}.`);
}
main().catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
});
//# sourceMappingURL=seed-dev-data.js.map