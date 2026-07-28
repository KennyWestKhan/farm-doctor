/**
 * Crop / disease photo manifest.
 *
 * HOW TO ADD A DISEASE REFERENCE PHOTO (lets a farmer visually compare their
 * leaf to a known example — often enough to identify it WITHOUT the AI):
 *  1. Drop a licensed image at  frontend/public/photos/diseases/<diseaseId>.jpg
 *     (e.g. public/photos/diseases/cocoa_black_pod.jpg).
 *  2. Enable it by uncommenting its id in AVAILABLE_DISEASE_PHOTOS below.
 *  3. The service worker precaches it in the build, so it works offline.
 *
 * Until an id is enabled, CropPhoto renders a branded placeholder (gradient +
 * crop emoji) — nothing breaks and no broken-image request is made.
 *
 * ⚠️ Use only licensed / CC0 images (e.g. PlantVillage CC0, Wikimedia, your own
 * field photos). Record the source in a comment beside each enabled id.
 */

// cropId -> image url (or null = placeholder). Emoji is the placeholder glyph.
export const CROP_PHOTOS = {
  chilli_pepper: { src: null, emoji: '🌶️', source: '' },
  cassava: { src: null, emoji: '🌿', source: '' },
  sweet_potato: { src: null, emoji: '🍠', source: '' },
  groundnut: { src: null, emoji: '🥜', source: '' },
  ginger: { src: null, emoji: '🫚', source: '' },
  cocoa: { src: null, emoji: '🍫', source: '' },
};

// diseaseId -> cropId, for the placeholder emoji (kept in sync with
// diseaseDatabase's ALL_DISEASES — 23 diseases across 6 crops).
const DISEASE_CROP = {
  chilli_anthracnose: 'chilli_pepper', chilli_bacterial_spot: 'chilli_pepper',
  chilli_rust: 'chilli_pepper', chilli_leaf_spot: 'chilli_pepper',
  cassava_brown_streak: 'cassava', cassava_mosaic: 'cassava',
  cassava_bacterial_blight: 'cassava', cassava_green_mite: 'cassava',
  sweetpotato_weevil: 'sweet_potato', sweetpotato_leafspot: 'sweet_potato',
  sweetpotato_virus: 'sweet_potato',
  groundnut_leafspot: 'groundnut', groundnut_rust: 'groundnut',
  groundnut_aflatoxin: 'groundnut', groundnut_rosette: 'groundnut',
  ginger_soft_rot: 'ginger', ginger_bacterial_wilt: 'ginger',
  ginger_rhizome_rot: 'ginger', ginger_leaf_spot: 'ginger',
  cocoa_black_pod: 'cocoa', cocoa_swollen_shoot: 'cocoa',
  cocoa_capsid: 'cocoa', cocoa_stem_borer: 'cocoa',
};

// Enable a disease photo by uncommenting its id once the file exists at
// public/photos/diseases/<id>.jpg. (All 23 are listed for convenience.)
export const AVAILABLE_DISEASE_PHOTOS = new Set([
  // 'chilli_anthracnose',      // source:
  // 'chilli_bacterial_spot',
  // 'chilli_rust',
  // 'chilli_leaf_spot',
  'cassava_brown_streak',      // Phillip Abidrabo, CC BY-SA 3.0 (Wikimedia Commons)
  // 'cassava_mosaic',
  // 'cassava_bacterial_blight',
  // 'cassava_green_mite',
  // 'sweetpotato_weevil',
  // 'sweetpotato_leafspot',
  // 'sweetpotato_virus',
  // 'groundnut_leafspot',
  // 'groundnut_rust',
  // 'groundnut_aflatoxin',
  // 'groundnut_rosette',
  // 'ginger_soft_rot',
  // 'ginger_bacterial_wilt',
  // 'ginger_rhizome_rot',
  // 'ginger_leaf_spot',
  'cocoa_black_pod',           // Scot Nelson, CC0 / public domain (Wikimedia Commons)
  // 'cocoa_swollen_shoot',
  // 'cocoa_capsid',
  // 'cocoa_stem_borer',
]);

export function cropPhoto(cropId) {
  return CROP_PHOTOS[cropId] || { src: null, emoji: '🌱', source: '' };
}

// Attribution per enabled photo (required for CC BY / BY-SA; blank for CC0).
// Full details in public/photos/diseases/ATTRIBUTIONS.md.
const DISEASE_PHOTO_CREDITS = {
  cocoa_black_pod: '', // Scot Nelson, CC0 — no attribution required
  cassava_brown_streak: 'Photo: Phillip Abidrabo, CC BY-SA 3.0',
};

export function diseasePhoto(diseaseId) {
  if (!AVAILABLE_DISEASE_PHOTOS.has(diseaseId)) return null;
  return {
    src: `/photos/diseases/${diseaseId}.jpg`,
    emoji: CROP_PHOTOS[DISEASE_CROP[diseaseId]]?.emoji || '🌱',
    source: DISEASE_PHOTO_CREDITS[diseaseId] || '',
  };
}
