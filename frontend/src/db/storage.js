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

// Always returns a valid UUID v4. crypto.randomUUID only exists in Chrome 92+
// (2021); on the older Android WebViews we target, we fall back to a hand-built
// v4 from getRandomValues (or Math.random as a last resort). This matters because
// report ids are written to a `uuid` column server-side (validations.report_id) —
// a non-UUID id silently breaks the treatment-validation loop on old devices.
const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
};

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

/** Reports not yet pushed to the server (they lack a `synced` flag). */
export async function getUnsyncedReports() {
  return (await getReports()).filter((r) => !r.synced);
}

/** Mark reports as synced after a successful push. */
export async function markReportsSynced(ids) {
  const d = await db();
  const tx = d.transaction('reports', 'readwrite');
  for (const id of ids) {
    const r = await tx.store.get(id);
    if (r && !r.synced) { r.synced = 1; await tx.store.put(r); }
  }
  await tx.done;
}

export async function getReport(id) {
  return (await db()).get('reports', id);
}

/** Merge a patch into a report (single read-modify-write transaction). Clears
 *  the `synced` flag so a corrected report (e.g. after a Vision recheck) is
 *  re-pushed, keeping the impact aggregates accurate. */
export async function updateReport(id, patch) {
  const tx = (await db()).transaction('reports', 'readwrite');
  const r = await tx.store.get(id);
  if (r) await tx.store.put({ ...r, ...patch, synced: 0 });
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
    } catch {
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

// ---- impact stats (cross-farmer, live from Supabase) ---------------------

/**
 * Aggregate impact metrics from the synced `reports` table plus the real signup
 * count. Anonymized — reads only crop/disease/region/status + an opaque user id,
 * never any personal data. Returns null when Supabase is unconfigured or offline
 * so the dashboard can fall back to this device's local reports.
 */
export async function fetchImpactStats() {
  if (!supabase || !navigator.onLine) return null;
  try {
    const [reportsRes, countRes] = await Promise.all([
      supabase.from('reports').select('user_id, region, disease_id, status, created_at'),
      supabase.rpc('app_user_count'),
    ]);
    const reports = reportsRes.data;
    if (reportsRes.error || !Array.isArray(reports)) return null;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const users = new Set();
    const regionCount = {};
    const diseaseCount = {};
    let last7 = 0;
    for (const r of reports) {
      if (r.user_id) users.add(r.user_id);
      if (r.region) regionCount[r.region] = (regionCount[r.region] || 0) + 1;
      if (r.disease_id) diseaseCount[r.disease_id] = (diseaseCount[r.disease_id] || 0) + 1;
      if (r.created_at && Date.parse(r.created_at) >= weekAgo) last7 += 1;
    }
    const userCount = typeof countRes?.data === 'number' ? countRes.data : null;

    return {
      diagnoses: reports.length,
      farmers: userCount ?? users.size, // real signups; fall back to distinct diagnosers
      diagnosers: users.size,
      regionCount,
      diseaseCount,
      regions: Object.keys(regionCount).length,
      last7,
    };
  } catch {
    return null;
  }
}
