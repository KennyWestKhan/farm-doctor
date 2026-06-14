/**
 * Lightweight user preferences in localStorage.
 *
 * Currently just the farmer's home region: asked once, reused on every diagnosis,
 * and changeable from the Home location chip. Synchronous reads are fine — the
 * value is tiny and needed on first render.
 */
import { REGIONS } from '../data/diseaseDatabase';

const REGION_KEY = 'fd_region';

export function getSavedRegion() {
  try {
    const r = localStorage.getItem(REGION_KEY);
    return r && REGIONS[r] ? r : null; // ignore unknown/stale values
  } catch {
    return null;
  }
}

export function setSavedRegion(region) {
  try {
    if (region && REGIONS[region]) localStorage.setItem(REGION_KEY, region);
  } catch {
    /* storage unavailable (private mode) — diagnosis still works, just re-asks */
  }
}
