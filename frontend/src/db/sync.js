/**
 * Background sync.
 *
 * When the device comes online we flush two queues to the backend:
 *  1. pendingVision  — photos that need Claude Vision (offline match was weak).
 *  2. validations    — "did it work?" feedback.
 *
 * The backend base URL comes from VITE_API_URL. If it's unset (e.g. local-only
 * demo) sync is a no-op and everything still lives happily in IndexedDB.
 *
 * Queues are flushed in small concurrent batches so a large backlog yields
 * between batches instead of firing every request at once or blocking on a long
 * sequential loop. A re-entrancy guard stops overlapping runs (e.g. repeated
 * `online` events) from double-sending.
 */
import {
  getPendingVision,
  removePendingVision,
  getUnsyncedValidations,
  markValidationSynced,
  updateReport,
} from './storage';
import { matchDiseaseByName } from '../data/diseaseDatabase';
import { notifyDiagnosisReady } from '../utils/notify.js';

const API = import.meta.env.VITE_API_URL || '';
const BATCH_SIZE = 4;

// Turn a Claude Vision result into a patch for the local report. When the AI's
// disease name maps to one of our crop's diseases, we adopt it (so the report
// shows our structured treatments/suppliers); the raw result is always kept.
function visionPatch(cropId, vision) {
  const matchedId = matchDiseaseByName(cropId, vision?.disease);
  const conf = typeof vision?.confidence === 'number' ? vision.confidence : 0;
  return {
    vision,
    visionAt: new Date().toISOString(),
    rechecked: true,
    ...(matchedId
      ? { topDiseaseId: matchedId, confidence: conf, status: conf >= 0.7 ? 'confident' : 'uncertain' }
      : {}),
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]); // strip data: prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Run `fn` over `items` in batches of `size`, yielding between batches. */
async function inBatches(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.allSettled(items.slice(i, i + size).map(fn));
  }
}

async function flushVision() {
  const items = await getPendingVision();
  await inBatches(items, BATCH_SIZE, async (item) => {
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
    // On success, write the AI diagnosis back onto the report, then clear the
    // queue item. On failure it stays queued for the next run.
    if (res.ok) {
      const vision = await res.json();
      await updateReport(item.reportId, visionPatch(item.cropId, vision));
      await removePendingVision(item.id);
      // Tell the farmer their earlier "unsure" check now has an AI answer —
      // this flush can complete after they've left the result screen.
      notifyDiagnosisReady();
    }
  });
}

async function flushValidations() {
  const items = await getUnsyncedValidations();
  await inBatches(items, BATCH_SIZE, async (v) => {
    const res = await fetch(`${API}/api/validations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    if (res.ok) await markValidationSynced(v.id);
  });
}

let syncing = false;

export async function syncNow() {
  if (!API || !navigator.onLine || syncing) return;
  syncing = true;
  try {
    await Promise.allSettled([flushVision(), flushValidations()]);
  } finally {
    syncing = false;
  }
}

/** Call once at app start: sync now (if online) and whenever we regain network. */
export function startSync() {
  syncNow();
  window.addEventListener('online', syncNow);
}
