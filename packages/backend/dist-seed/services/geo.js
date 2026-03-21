"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoTableUtil = exports.geoDataManager = void 0;
exports.putStore = putStore;
exports.queryNearby = queryNearby;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dynamodb_geo_v3_1 = require("dynamodb-geo-v3");
Object.defineProperty(exports, "GeoTableUtil", { enumerable: true, get: function () { return dynamodb_geo_v3_1.GeoTableUtil; } });
const shared_1 = require("@ichiban-kuji/shared");
// ---------------------------------------------------------------------------
// Geo Data Manager singleton
// ---------------------------------------------------------------------------
const ddbClient = new client_dynamodb_1.DynamoDB({});
const geoConfig = new dynamodb_geo_v3_1.GeoDataManagerConfiguration(ddbClient, shared_1.GEO_TABLE_NAME);
geoConfig.hashKeyLength = 5;
const geoDataManager = new dynamodb_geo_v3_1.GeoDataManager(geoConfig);
exports.geoDataManager = geoDataManager;
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Insert or update a store in the geo table.
 */
async function putStore(store) {
    await geoDataManager.putPoint({
        RangeKeyValue: { S: store.storeId },
        GeoPoint: { latitude: store.lat, longitude: store.lng },
        PutItemInput: {
            Item: {
                storeId: { S: store.storeId },
                storeName: { S: store.storeName },
                address: { S: store.address },
                managerId: { S: store.managerId },
            },
        },
    });
}
/**
 * Query stores within a radius (km) of a given point.
 * Returns raw geo query results with distance information.
 */
async function queryNearby(lat, lng, radiusKm) {
    const radiusMeters = radiusKm * 1000;
    const result = await geoDataManager.queryRadius({
        RadiusInMeter: radiusMeters,
        CenterPoint: { latitude: lat, longitude: lng },
    });
    return result.map((item) => {
        const storeId = item.storeId?.S ?? '';
        // Calculate approximate distance using Haversine
        const storeLat = parseFloat(item.geoJson?.S ? JSON.parse(item.geoJson.S).coordinates[1] : '0');
        const storeLng = parseFloat(item.geoJson?.S ? JSON.parse(item.geoJson.S).coordinates[0] : '0');
        const distance = haversineKm(lat, lng, storeLat, storeLng);
        return { storeId, distance };
    });
}
// ---------------------------------------------------------------------------
// Haversine helper
// ---------------------------------------------------------------------------
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) {
    return (deg * Math.PI) / 180;
}
//# sourceMappingURL=geo.js.map