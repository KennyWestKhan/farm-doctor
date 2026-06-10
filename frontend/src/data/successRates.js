/**
 * Seeded crowdsourced success rates.
 *
 * ⚠️ DEMO DATA for the competition. In production these numbers are computed from
 * the `validations` table (farmers reporting whether a treatment worked), broken
 * down by treatment + region. The shape here mirrors that aggregation so the UI
 * and dashboard can be swapped to live data with no component changes.
 *
 * Keyed by `${treatmentId}__${region}`.
 */
const RATES = {
  // Chilli anthracnose — Copper
  'chilli_anthracnose_copper__ashanti': { total: 47, success: 39, partial: 5, failed: 3, trendDelta: +4 },
  'chilli_anthracnose_copper__greater_accra': { total: 28, success: 20, partial: 5, failed: 3, trendDelta: -1 },
  'chilli_anthracnose_copper__western': { total: 19, success: 16, partial: 2, failed: 1, trendDelta: +2 },
  'chilli_anthracnose_mancozeb__ashanti': { total: 22, success: 17, partial: 3, failed: 2, trendDelta: +1 },

  // Chilli bacterial spot
  'chilli_bacterial_copper__greater_accra': { total: 24, success: 18, partial: 4, failed: 2, trendDelta: +3 },
  'chilli_bacterial_copper__volta': { total: 15, success: 11, partial: 2, failed: 2, trendDelta: 0 },

  // Chilli rust
  'chilli_rust_sulfur__northern': { total: 18, success: 15, partial: 2, failed: 1, trendDelta: +2 },

  // Cassava
  'cassava_cbsd_rogue__western': { total: 31, success: 26, partial: 3, failed: 2, trendDelta: +5 },
  'cassava_cbsd_rogue__volta': { total: 20, success: 17, partial: 2, failed: 1, trendDelta: +1 },
  'cassava_cmd_resistant__ashanti': { total: 26, success: 23, partial: 2, failed: 1, trendDelta: +3 },

  // Sweet potato
  'sweetpotato_weevil_earthup__northern': { total: 23, success: 18, partial: 3, failed: 2, trendDelta: +2 },
  'sweetpotato_weevil_earthup__volta': { total: 17, success: 13, partial: 2, failed: 2, trendDelta: 0 },
  'sweetpotato_leafspot_mancozeb__western': { total: 14, success: 11, partial: 2, failed: 1, trendDelta: +1 },

  // Groundnut
  'groundnut_leafspot_chlorothalonil__northern': { total: 29, success: 24, partial: 3, failed: 2, trendDelta: +4 },
  'groundnut_rust_sulfur__northern': { total: 16, success: 13, partial: 2, failed: 1, trendDelta: +1 },
  'groundnut_aflatoxin_drying__northern': { total: 21, success: 19, partial: 1, failed: 1, trendDelta: +6 },
};

export function getSuccessRate(treatmentId, region) {
  const exact = RATES[`${treatmentId}__${region}`];
  if (exact) return { ...exact, region, exact: true, percent: Math.round((exact.success / exact.total) * 100) };

  // Fall back to pooled across all regions for this treatment.
  const pooled = Object.entries(RATES)
    .filter(([k]) => k.startsWith(`${treatmentId}__`))
    .map(([, v]) => v);
  if (pooled.length === 0) return null;

  const agg = pooled.reduce(
    (a, v) => ({ total: a.total + v.total, success: a.success + v.success, partial: a.partial + v.partial, failed: a.failed + v.failed }),
    { total: 0, success: 0, partial: 0, failed: 0 }
  );
  return { ...agg, region: null, exact: false, trendDelta: 0, percent: Math.round((agg.success / agg.total) * 100) };
}

/** Aggregate figures for the judges' dashboard. Derived from the same seed. */
export function dashboardStats() {
  const rows = Object.entries(RATES);
  const totals = rows.reduce(
    (a, [, v]) => ({ total: a.total + v.total, success: a.success + v.success }),
    { total: 0, success: 0 }
  );
  const farmersTested = 157; // seeded headcount (a farmer may submit several validations)
  return {
    farmersTested,
    diagnoses: 284,
    validations: totals.total,
    avgSuccess: Math.round((totals.success / totals.total) * 100),
  };
}
