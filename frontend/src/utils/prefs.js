/**
 * Lightweight user preferences in localStorage.
 *
 * Currently just the farmer's home region: asked once, reused on every diagnosis,
 * and changeable from the Home location chip. Synchronous reads are fine — the
 * value is tiny and needed on first render.
 */
import { REGIONS, CROPS } from '../data/diseaseDatabase';

const REGION_KEY = 'fd_region';
const CROPS_KEY = 'fd_crops';

export function getSavedRegion() {
  try {
    const r = localStorage.getItem(REGION_KEY);
    return r && REGIONS[r] ? r : null;
  } catch {
    return null;
  }
}

export function setSavedRegion(region) {
  try {
    if (region && REGIONS[region]) localStorage.setItem(REGION_KEY, region);
  } catch { /* private browsing */ }
}

export function getSavedCrops() {
  try {
    const raw = localStorage.getItem(CROPS_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw);
    const valid = CROPS.map((c) => c.id);
    return ids.filter((id) => valid.includes(id));
  } catch {
    return [];
  }
}

export function setSavedCrops(cropIds) {
  try {
    localStorage.setItem(CROPS_KEY, JSON.stringify(cropIds));
  } catch { /* private browsing */ }
}
