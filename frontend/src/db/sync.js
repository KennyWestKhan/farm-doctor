/**
 * Background sync.
 *
 * When the device comes online we flush two queues to the backend:
 *  1. pendingVision  — photos that need Claude Vision (offline match was weak).
 *  2. validations    — "did it work?" feedback.
 *
 * The backend base URL comes from VITE_API_URL. If it's unset (e.g. local-only
 * demo) sync is a no-op and everything still lives happily in IndexedDB.
 */
import {
  getPendingVision,
  removePendingVision,
  getUnsyncedValidations,
  markValidationSynced,
} from './storage';

const API = import.meta.env.VITE_API_URL || '';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]); // strip data: prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function flushVision() {
  if (!API) return;
  const items = await getPendingVision();
  for (const item of items) {
    try {
      const imageBase64 = await blobToBase64(item.photoBlob);
      const res = await fetch(`${API}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mediaType: item.photoBlob.type || 'image/jpeg',
          reportId: item.reportId,
          cropId: item.cropId,
        }),
      });
      if (res.ok) {
        // The Vision result is associated server-side with reportId; we just clear
        // the local queue item. A future enhancement: store the returned diagnosis
        // back into the local report and notify the farmer.
        await removePendingVision(item.id);
      }
    } catch {
      // Stay queued; we'll retry on the next online event.
    }
  }
}

async function flushValidations() {
  if (!API) return;
  const items = await getUnsyncedValidations();
  for (const v of items) {
    try {
      const res = await fetch(`${API}/api/validations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      if (res.ok) await markValidationSynced(v.id);
    } catch {
      // retry later
    }
  }
}

export async function syncNow() {
  if (!navigator.onLine) return;
  await Promise.allSettled([flushVision(), flushValidations()]);
}

/** Call once at app start: sync now (if online) and whenever we regain network. */
export function startSync() {
  syncNow();
  window.addEventListener('online', syncNow);
}
