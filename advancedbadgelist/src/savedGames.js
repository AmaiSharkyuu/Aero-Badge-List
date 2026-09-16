// Saved games: the badge list of a game is kept in chrome.storage.local so the
// next visit doesn't have to page through every badge again. Only the badges
// themselves are stored; ownership depends on which user is being viewed and
// is always checked live.
//
// The index is kept separate from the badge rows so the menus can list saved
// games without reading megabytes of badge data.

export const INDEX_KEY = "ablSavedGames";

const BADGES_PREFIX = "ablSavedBadges:";
const FORMAT_VERSION = 1;

export function badgesKey(universeId) {
    return BADGES_PREFIX + universeId;
}

function storageGet(key) {
    return new Promise(resolve => {
        chrome.storage.local.get(key, res => resolve(res ? res[key] : undefined));
    });
}

function storageSet(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
            const error = chrome.runtime.lastError;
            error ? reject(new Error(error.message)) : resolve();
        });
    });
}

function storageRemove(keys) {
    return new Promise(resolve => {
        chrome.storage.local.remove(keys, resolve);
    });
}

export async function getSavedIndex() {
    const index = await storageGet(INDEX_KEY);
    return index && typeof index === "object" ? index : {};
}

// Rows are compact arrays rather than objects: a 13,000-badge game is several
// megabytes, and repeating every key name for every badge would roughly double it.
export function toRow(id, info) {
    return [
        id,
        info.enabled ? 1 : 0,
        info.name,
        info.desc,
        info.created,
        info.updated,
        info.count,
        info.countToday,
        info.rate,
        info.iconId
    ];
}

// `value` is left out on purpose: it depends on the order badges were created
// in and on NVL.json, so the caller recomputes it rather than trusting an old save.
export function fromRow(row) {
    return {
        id: row[0],
        info: {
            enabled: row[1] === 1,
            name: row[2],
            desc: row[3],
            created: row[4],
            updated: row[5],
            count: row[6],
            countToday: row[7],
            rate: row[8],
            iconId: row[9]
        }
    };
}

export async function getSavedBadges(universeId) {
    const data = await storageGet(badgesKey(universeId));

    if (!data || data.version !== FORMAT_VERSION || !Array.isArray(data.rows)) {
        return null;
    }

    return data.rows;
}

export async function saveGame(universeId, meta, rows) {
    const payload = { version: FORMAT_VERSION, rows };

    const entry = {
        name: meta.name,
        placeId: meta.placeId,
        count: rows.length,
        savedAt: Date.now(),
        // getBytesInUse isn't available on every browser we support, so the
        // size shown in the menus is measured here instead.
        bytes: JSON.stringify(payload).length
    };

    await storageSet({ [badgesKey(universeId)]: payload });

    const index = await getSavedIndex();
    index[universeId] = entry;
    await storageSet({ [INDEX_KEY]: index });

    return entry;
}

export async function removeGame(universeId) {
    const index = await getSavedIndex();
    delete index[universeId];

    await storageSet({ [INDEX_KEY]: index });
    await storageRemove(badgesKey(universeId));
}

export async function removeAllGames() {
    const index = await getSavedIndex();
    const keys = Object.keys(index).map(badgesKey);

    await storageSet({ [INDEX_KEY]: {} });
    await storageRemove(keys);
}

export function sortedEntries(index) {
    return Object.entries(index).sort((a, b) => (b[1].savedAt || 0) - (a[1].savedAt || 0));
}

export function formatCount(n) {
    return Number(n || 0).toLocaleString("en-US");
}

export function formatAge(timestamp, now = Date.now()) {
    const seconds = Math.max(0, Math.round((now - timestamp) / 1000));

    if (seconds < 60) return "just now";

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;

    const days = Math.round(hours / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
