/**
 * IndexedDB layer (via idb).
 *
 * Stores:
 *  - reports:        every diagnosis (offline or online). Index: createdAt.
 *  - pendingVision:  photos queued for Claude Vision when back online.
 *  - validations:    "did it work?" feedback. Indexes: synced, reportId.
 *
 * Performance notes (why this file looks the way it does):
 *  - ONE connection. `db()` memoises a single openDB promise instead of opening a
 *    fresh connection on every call.
 *  - Read only what you need. Lookups go through indexes (getAllFromIndex /
 *    cursors) rather than getAll()-then-filter-in-JS, and `getRecentReports`
 *    reads just N rows via a reverse cursor.
 *  - Single-transaction writes for read-modify-write (markValidationSynced).
 */
import { openDB } from 'idb';

const DB_NAME = 'farm-doctor';
const DB_VERSION = 2; // v2: add `reportId` index on validations

let _dbPromise = null;

function db() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion, _newVersion, tx) {
        if (!database.objectStoreNames.contains('reports')) {
          database.createObjectStore('reports', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        }
        if (!database.objectStoreNames.contains('pendingVision')) {
          database.createObjectStore('pendingVision', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('validations')) {
          const v = database.createObjectStore('validations', { keyPath: 'id' });
          v.createIndex('synced', 'synced');
          v.createIndex('reportId', 'reportId');
        } else if (oldVersion < 2) {
          // Existing installs: add the new index to the live store.
          const v = tx.objectStore('validations');
          if (!v.indexNames.contains('reportId')) v.createIndex('reportId', 'reportId');
        }
      },
      terminated() {
        _dbPromise = null; // allow a reconnect if the connection is dropped
      },
    });
  }
  return _dbPromise;
}

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ---- reports -------------------------------------------------------------

export async function saveReport(report) {
  const record = {
    id: uid(),
    createdAt: new Date().toISOString(),
    offline: !navigator.onLine,
    ...report,
  };
  await (await db()).put('reports', record);
  return record;
}

/** All reports, newest first (createdAt is ISO, so index order == chronological). */
export async function getReports() {
  const rows = await (await db()).getAllFromIndex('reports', 'createdAt');
  return rows.reverse();
}

/** Just the N most recent reports — reads only N rows via a reverse cursor. */
export async function getRecentReports(limit = 3) {
  const out = [];
  let cursor = await (await db())
    .transaction('reports')
    .store.index('createdAt')
    .openCursor(null, 'prev');
  while (cursor && out.length < limit) {
    out.push(cursor.value);
    cursor = await cursor.continue();
  }
  return out;
}

export async function getReport(id) {
  return (await db()).get('reports', id);
}

// ---- pending Claude Vision queue ----------------------------------------

export async function queueForVision({ reportId, cropId, photoBlob }) {
  const record = { id: uid(), reportId, cropId, photoBlob, queuedAt: new Date().toISOString() };
  await (await db()).put('pendingVision', record);
  return record;
}

export async function getPendingVision() {
  return (await db()).getAll('pendingVision');
}

export async function removePendingVision(id) {
  await (await db()).delete('pendingVision', id);
}

// ---- validations ---------------------------------------------------------

export async function saveValidation(validation) {
  const record = {
    id: uid(),
    createdAt: new Date().toISOString(),
    synced: 0, // idb indexes don't key reliably on booleans; use 0/1
    ...validation,
  };
  await (await db()).put('validations', record);
  return record;
}

/** Unsynced rows only, via the `synced` index (no full-table scan). */
export async function getUnsyncedValidations() {
  return (await db()).getAllFromIndex('validations', 'synced', 0);
}

/** Validations for one report, via the `reportId` index, newest first. */
export async function getValidationsForReport(reportId) {
  const rows = await (await db()).getAllFromIndex('validations', 'reportId', reportId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markValidationSynced(id) {
  const tx = (await db()).transaction('validations', 'readwrite');
  const v = await tx.store.get(id);
  if (v) {
    v.synced = 1;
    await tx.store.put(v);
  }
  await tx.done;
}
