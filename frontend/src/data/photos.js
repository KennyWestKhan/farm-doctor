/**
 * Crop / disease photo manifest.
 *
 * HOW TO ADD REAL PHOTOS
 *  1. Drop image files into  frontend/public/photos/   (e.g. chilli_pepper.jpg).
 *  2. Point the entry below at  /photos/<file>  .
 *  3. The service worker precaches everything in the build, so they work offline.
 *
 * Until a real file is set, CropPhoto renders a branded placeholder (gradient +
 * crop emoji) — nothing breaks. Keep files small (<120 KB, ~800px) for cheap
 * phones; the whole app should stay well under a few MB.
 *
 * ⚠️ Use only licensed / CC0 images (Unsplash, Pexels, your own). Record the
 * source in the comment beside each entry.
 */

// cropId -> image url (or null = placeholder). Emoji is the placeholder glyph.
export const CROP_PHOTOS = {
  chilli_pepper: { src: null, emoji: '🌶️', source: '' },
  cassava: { src: null, emoji: '🌿', source: '' },
  sweet_potato: { src: null, emoji: '🍠', source: '' },
  groundnut: { src: null, emoji: '🥜', source: '' },
};

// Optional per-disease close-up photos (symptom reference). diseaseId -> url.
export const DISEASE_PHOTOS = {
  // e.g. chilli_anthracnose: { src: '/photos/chilli_anthracnose.jpg', source: 'Pexels' },
};

export function cropPhoto(cropId) {
  return CROP_PHOTOS[cropId] || { src: null, emoji: '🌱', source: '' };
}

export function diseasePhoto(diseaseId) {
  return DISEASE_PHOTOS[diseaseId] || null;
}
