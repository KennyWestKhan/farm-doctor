/**
 * Supplier favourites, default pin, notes, and WhatsApp contact tracking.
 *
 * Stored in IndexedDB alongside the existing farm-doctor database. Uses a
 * separate DB version bump (v3) to add two new object stores:
 *   - supplierFavs:    starred/pinned suppliers + notes
 *   - supplierContacts: WhatsApp/call tap counts (for auto-suggest)
 *
 * Since storage.js owns the DB connection and version, we extend it there and
 * export helpers from this file that go through the same `db()` connection.
 */
import { openDB } from 'idb';

const DB_NAME = 'farm-doctor';
const DB_VERSION = 4;

let _dbPromise = null;

function db() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion, _newVersion, tx) {
        // v1 stores
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
          const v = tx.objectStore('validations');
          if (!v.indexNames.contains('reportId')) v.createIndex('reportId', 'reportId');
        }

        // v3 stores — supplier favorites + contact tracking
        if (!database.objectStoreNames.contains('supplierFavs')) {
          database.createObjectStore('supplierFavs', { keyPath: 'supplierId' });
        }
        if (!database.objectStoreNames.contains('supplierContacts')) {
          database.createObjectStore('supplierContacts', { keyPath: 'supplierId' });
        }

        // v4 store — cached treatment success rates from Supabase
        if (!database.objectStoreNames.contains('successRates')) {
          database.createObjectStore('successRates', { keyPath: 'key' });
        }
      },
      terminated() { _dbPromise = null; },
    });
  }
  return _dbPromise;
}

// Re-export so storage.js can share the same upgraded connection
export { db };

// ---- Favourites (star + pin + notes) ------------------------------------

export async function getFavourites() {
  return (await db()).getAll('supplierFavs');
}

export async function getFavourite(supplierId) {
  return (await db()).get('supplierFavs', supplierId);
}

export async function toggleFavourite(supplierId) {
  const d = await db();
  const existing = await d.get('supplierFavs', supplierId);
  if (existing) {
    await d.delete('supplierFavs', supplierId);
    return null;
  }
  const record = { supplierId, starred: true, isDefault: false, notes: '', createdAt: new Date().toISOString() };
  await d.put('supplierFavs', record);
  return record;
}

export async function setDefaultSupplier(supplierId) {
  const d = await db();
  const all = await d.getAll('supplierFavs');
  const tx = d.transaction('supplierFavs', 'readwrite');
  for (const fav of all) {
    if (fav.isDefault && fav.supplierId !== supplierId) {
      await tx.store.put({ ...fav, isDefault: false });
    }
  }
  const current = await tx.store.get(supplierId);
  if (current) {
    await tx.store.put({ ...current, isDefault: true });
  } else {
    await tx.store.put({ supplierId, starred: true, isDefault: true, notes: '', createdAt: new Date().toISOString() });
  }
  await tx.done;
}

export async function updateSupplierNote(supplierId, notes) {
  const d = await db();
  const existing = await d.get('supplierFavs', supplierId);
  if (existing) {
    await d.put('supplierFavs', { ...existing, notes });
  } else {
    await d.put('supplierFavs', { supplierId, starred: true, isDefault: false, notes, createdAt: new Date().toISOString() });
  }
}

// ---- Contact tracking (WhatsApp/call taps → auto-suggest) ---------------

export async function recordContact(supplierId) {
  const d = await db();
  const existing = await d.get('supplierContacts', supplierId);
  if (existing) {
    await d.put('supplierContacts', { ...existing, count: existing.count + 1, lastContact: new Date().toISOString() });
  } else {
    await d.put('supplierContacts', { supplierId, count: 1, lastContact: new Date().toISOString() });
  }
}

export async function getContactCounts() {
  return (await db()).getAll('supplierContacts');
}

const SUGGEST_THRESHOLD = 3;

export async function getSuggestedFavourites() {
  const [contacts, favs] = await Promise.all([getContactCounts(), getFavourites()]);
  const favIds = new Set(favs.map((f) => f.supplierId));
  return contacts
    .filter((c) => c.count >= SUGGEST_THRESHOLD && !favIds.has(c.supplierId))
    .sort((a, b) => b.count - a.count);
}
