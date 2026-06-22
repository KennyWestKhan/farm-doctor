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
import { db } from './favorites';
import { supabase } from './supabase';

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

/** Merge a patch into a report (single read-modify-write transaction). */
export async function updateReport(id, patch) {
  const tx = (await db()).transaction('reports', 'readwrite');
  const r = await tx.store.get(id);
  if (r) await tx.store.put({ ...r, ...patch });
  await tx.done;
  return r ? { ...r, ...patch } : null;
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

// ---- treatment success rates (live from Supabase, cached in IDB) ----------

const RATE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all treatment success rates from the Supabase view.
 * Results are cached in IDB so the app works offline.
 * Returns a Map keyed by `${treatmentId}__${region}`.
 */
export async function fetchSuccessRates() {
  const d = await db();

  // Try Supabase first (if configured and online)
  if (supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('treatment_success_rates')
        .select('treatment_id, region, total, success, partial, failed, success_percent');

      if (!error && data) {
        // Cache each row in IDB with a timestamp
        const tx = d.transaction('successRates', 'readwrite');
        // Clear stale cache
        await tx.store.clear();
        const now = Date.now();
        for (const row of data) {
          const key = `${row.treatment_id}__${row.region}`;
          await tx.store.put({
            key,
            treatmentId: row.treatment_id,
            region: row.region,
            total: row.total,
            success: row.success,
            partial: row.partial,
            failed: row.failed,
            percent: row.success_percent,
            cachedAt: now,
          });
        }
        await tx.done;

        return buildRateMap(data.map((row) => ({
          key: `${row.treatment_id}__${row.region}`,
          treatmentId: row.treatment_id,
          region: row.region,
          total: row.total,
          success: row.success,
          partial: row.partial,
          failed: row.failed,
          percent: row.success_percent,
        })));
      }
    } catch (_) {
      // Network error — fall through to cache
    }
  }

  // Fall back to IDB cache
  const cached = await d.getAll('successRates');
  if (cached.length && Date.now() - cached[0].cachedAt < RATE_CACHE_TTL) {
    return buildRateMap(cached);
  }

  // No data at all
  return new Map();
}

function buildRateMap(rows) {
  const map = new Map();
  for (const r of rows) {
    map.set(r.key, r);
  }
  return map;
}

/**
 * Look up a single treatment's success rate from a pre-fetched map.
 * Falls back to pooling across regions, same logic as the old seeded data.
 * Returns null when no real data exists.
 */
export function lookupSuccessRate(rateMap, treatmentId, region) {
  if (!rateMap || rateMap.size === 0) return null;

  // Exact match for treatment + region
  const exact = rateMap.get(`${treatmentId}__${region}`);
  if (exact) return { ...exact, exact: true, trendDelta: 0 };

  // Pool across all regions for this treatment
  const pooled = [];
  for (const [k, v] of rateMap) {
    if (k.startsWith(`${treatmentId}__`)) pooled.push(v);
  }
  if (pooled.length === 0) return null;

  const agg = pooled.reduce(
    (a, v) => ({ total: a.total + v.total, success: a.success + v.success, partial: a.partial + v.partial, failed: a.failed + v.failed }),
    { total: 0, success: 0, partial: 0, failed: 0 },
  );
  return {
    ...agg,
    region: null,
    exact: false,
    trendDelta: 0,
    percent: Math.round((agg.success / agg.total) * 100),
  };
}
