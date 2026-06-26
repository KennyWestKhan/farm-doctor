import { useState, useEffect } from 'react';
import { fetchSuccessRates, lookupSuccessRate } from '../db/storage';

/**
 * Shared hook that fetches real success-rate data from Supabase (via the
 * treatment_success_rates view) once, caches in IndexedDB, and provides a
 * lookup helper.  All TreatmentCard instances on a page share the same fetch
 * because React batches the initial render — the IDB cache serves subsequent
 * mounts instantly.
 *
 * Returns { loading, getRate }.
 *   - loading: true while the first fetch is in progress
 *   - getRate(treatmentId, region): returns a rate object or null
 */

let _cache = null;
let _promise = null;

function load() {
  if (!_promise) {
    _promise = fetchSuccessRates().then((map) => {
      _cache = map;
      return map;
    }).catch(() => {
      _cache = new Map();
      return _cache;
    });
  }
  return _promise;
}

export default function useSuccessRates() {
  const [ready, setReady] = useState(!!_cache);

  useEffect(() => {
    if (_cache) { setReady(true); return; } // eslint-disable-line react-hooks/set-state-in-effect
    let cancelled = false;
    load().then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const getRate = (treatmentId, region) => {
    if (!_cache) return undefined; // still loading
    return lookupSuccessRate(_cache, treatmentId, region);
  };

  return { loading: !ready, getRate };
}

/** Call this to bust the in-memory cache (e.g. after a new validation is submitted). */
export function invalidateSuccessRates() {
  _cache = null;
  _promise = null;
}
