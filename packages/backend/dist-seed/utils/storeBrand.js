"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStoreBrand = isStoreBrand;
exports.inferStoreBrandFromName = inferStoreBrandFromName;
exports.resolveStoreBrand = resolveStoreBrand;
const STORE_BRANDS = ['lawson', 'familymart', 'seven-eleven', 'other'];
function isStoreBrand(value) {
    return typeof value === 'string' && STORE_BRANDS.includes(value);
}
function inferStoreBrandFromName(storeName) {
    const normalizedName = storeName.toLowerCase();
    if (normalizedName.includes('ローソン') || normalizedName.includes('lawson')) {
        return 'lawson';
    }
    if (normalizedName.includes('ファミリーマート')
        || normalizedName.includes('ファミマ')
        || normalizedName.includes('familymart')) {
        return 'familymart';
    }
    if (normalizedName.includes('セブン')
        || normalizedName.includes('7-eleven')
        || normalizedName.includes('seven-eleven')
        || normalizedName.includes('seven')) {
        return 'seven-eleven';
    }
    return 'other';
}
function resolveStoreBrand(storeBrand, storeName) {
    if (isStoreBrand(storeBrand)) {
        return storeBrand;
    }
    return inferStoreBrandFromName(storeName);
}
//# sourceMappingURL=storeBrand.js.map