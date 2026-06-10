/**
 * IndexedDB layer (via idb).
 *
 * Three stores:
 *  - reports:        every diagnosis the farmer makes (offline or online).
 *  - pendingVision:  photos whose offline match was weak, queued to send to
 *                    Claude Vision when the device next has internet.
 *  - validations:    "did the treatment work?" feedback, queued to sync to backend.
 *
 * Everything is written locally first. A background sync (see sync.js) flushes the
 * pendingVision and validations queues when connectivity returns.
 */
import { openDB } from 'idb';

const DB_NAME = 'farm-doctor';
const DB_VERSION = 1;

export function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('reports')) {
        const reports = db.createObjectStore('reports', { keyPath: 'id' });
        reports.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('pendingVision')) {
        db.createObjectStore('pendingVision', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('validations')) {
        const v = db.createObjectStore('validations', { keyPath: 'id' });
        v.createIndex('synced', 'synced');
      }
    },
  });
}

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ---- reports -------------------------------------------------------------

export async function saveReport(report) {
  const db = await getDB();
  const record = {
    id: uid(),
    createdAt: new Date().toISOString(),
    offline: !navigator.onLine,
    ...report,
  };
  await db.put('reports', record);
  return record;
}

export async function getReports() {
  const db = await getDB();
  return (await db.getAll('reports')).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

// ---- pending Claude Vision queue ----------------------------------------

export async function queueForVision({ reportId, cropId, photoBlob }) {
  const db = await getDB();
  const record = {
    id: uid(),
    reportId,
    cropId,
    photoBlob, // stored as Blob; IndexedDB handles binary natively
    queuedAt: new Date().toISOString(),
  };
  await db.put('pendingVision', record);
  return record;
}

export async function getPendingVision() {
  const db = await getDB();
  return db.getAll('pendingVision');
}

export async function removePendingVision(id) {
  const db = await getDB();
  await db.delete('pendingVision', id);
}

// ---- validations ---------------------------------------------------------

export async function saveValidation(validation) {
  const db = await getDB();
  const record = {
    id: uid(),
    createdAt: new Date().toISOString(),
    synced: 0, // idb indexes can't key on booleans reliably; use 0/1
    ...validation,
  };
  await db.put('validations', record);
  return record;
}

export async function getUnsyncedValidations() {
  const db = await getDB();
  const all = await db.getAll('validations');
  return all.filter((v) => !v.synced);
}

export async function markValidationSynced(id) {
  const db = await getDB();
  const v = await db.get('validations', id);
  if (v) {
    v.synced = 1;
    await db.put('validations', v);
  }
}
