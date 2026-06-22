/**
 * Guest-to-account data migration.
 *
 * When a guest creates an account, all orphaned local data (reports,
 * validations, supplier favourites) gets stamped with their new user ID.
 * This runs once after the first successful sign-in.
 */
import { db } from '../db/favorites';

const MIGRATED_KEY = 'fd_migrated';

export async function migrateGuestData(userId) {
  try {
    if (localStorage.getItem(MIGRATED_KEY) === userId) return;
  } catch { /* private browsing */ }

  const d = await db();

  // Tag all reports that have no userId
  const reportTx = d.transaction('reports', 'readwrite');
  let cursor = await reportTx.store.openCursor();
  while (cursor) {
    if (!cursor.value.userId) {
      await cursor.update({ ...cursor.value, userId });
    }
    cursor = await cursor.continue();
  }
  await reportTx.done;

  // Tag all validations that have no userId
  const valTx = d.transaction('validations', 'readwrite');
  let vCursor = await valTx.store.openCursor();
  while (vCursor) {
    if (!vCursor.value.userId) {
      await vCursor.update({ ...vCursor.value, userId });
    }
    vCursor = await vCursor.continue();
  }
  await valTx.done;

  // Tag supplier favourites
  const favTx = d.transaction('supplierFavs', 'readwrite');
  let fCursor = await favTx.store.openCursor();
  while (fCursor) {
    if (!fCursor.value.userId) {
      await fCursor.update({ ...fCursor.value, userId });
    }
    fCursor = await fCursor.continue();
  }
  await favTx.done;

  // Tag contact tracking
  const contactTx = d.transaction('supplierContacts', 'readwrite');
  let cCursor = await contactTx.store.openCursor();
  while (cCursor) {
    if (!cCursor.value.userId) {
      await cCursor.update({ ...cCursor.value, userId });
    }
    cCursor = await cCursor.continue();
  }
  await contactTx.done;

  try {
    localStorage.setItem(MIGRATED_KEY, userId);
  } catch { /* private browsing */ }
}
