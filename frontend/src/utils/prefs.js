/**
 * Lightweight user preferences in localStorage.
 *
 * Region: asked once, reused on every diagnosis, changeable from the Home
 * location chip. Farm size: saved from the treatment farm-size picker so the
 * farmer isn't re-asked on every diagnosis — but the picker still shows on
 * each result (a farmer may treat a different plot) with the saved value
 * pre-filled. Synchronous reads are fine — values are tiny and needed on
 * first render.
 */
import { REGIONS, CROPS } from '../data/diseaseDatabase';
import { suggestLoads, DEFAULT_ACRES, MIN_LOADS, MAX_LOADS } from '../data/farmSize.js';

const REGION_KEY = 'fd_region';
const CROPS_KEY = 'fd_crops';
const FARM_KEY = 'fd_farm';

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

/** { acres, loads, cropId } — the farm size + last confirmed load count. */
export function getSavedFarm() {
  try {
    const raw = localStorage.getItem(FARM_KEY);
    if (!raw) return null;
    const f = JSON.parse(raw);
    if (typeof f?.acres !== 'number' || f.acres <= 0) return null;
    if (!Number.isInteger(f.loads) || f.loads < MIN_LOADS || f.loads > MAX_LOADS) return null;
    return f;
  } catch {
    return null;
  }
}

export function setSavedFarm(farm) {
  try {
    localStorage.setItem(FARM_KEY, JSON.stringify(farm));
  } catch { /* private browsing */ }
}

/**
 * Starting load count for a diagnosis: the farmer's own confirmed number if
 * it was for this same crop, otherwise a fresh suggestion from their saved
 * farm size (defaulting to a medium farm when nothing is saved yet).
 */
export function initialLoadsForCrop(cropId) {
  const saved = getSavedFarm();
  if (saved && saved.cropId === cropId) return saved.loads;
  return suggestLoads(saved?.acres ?? DEFAULT_ACRES, cropId);
}
