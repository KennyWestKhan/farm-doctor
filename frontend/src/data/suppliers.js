/**
 * Vendor filtering + contact-link helpers.
 *
 * Data is real (Complete Farmer's compiled directory) and loaded asynchronously
 * via db/vendors.js — this module holds only pure functions over a vendor list.
 *
 * Vendor shape (see vendors.seed.json):
 *   { id, name, contactPerson, phones[], whatsapp[], emails[], categories[],
 *     subcategories[], crops[], services[], addressText, area, region, lat, lng }
 */
import { PRODUCT_CATEGORIES } from './vendorCategories';

/**
 * Filter vendors by region + category, then best-effort rank by a keyword (e.g.
 * a diagnosed treatment name). Keyword only re-orders — it never excludes — so a
 * category search still returns the full category even when nothing name-matches.
 */
export function filterVendors(vendors, { region, category, keyword } = {}) {
  let list = vendors.filter((v) => {
    if (region && region !== 'all' && v.region !== region) return false;
    if (category && !v.categories.includes(category)) return false;
    return true;
  });

  const kw = (keyword || '').toLowerCase().trim();
  if (kw) {
    const tokens = kw.split(/\s+/).filter((t) => t.length > 2);
    const score = (v) => {
      const hay = `${v.name} ${(v.services || []).join(' ')} ${(v.crops || []).join(' ')}`.toLowerCase();
      return tokens.some((t) => hay.includes(t)) ? 1 : 0;
    };
    list = [...list].sort((a, b) => score(b) - score(a));
  }
  return list;
}

/** Distinct regions present in the data (for the region filter chips). */
export function regionsInData(vendors) {
  return [...new Set(vendors.map((v) => v.region).filter(Boolean))];
}

/** Preferred number to call: first phone (landline or mobile both dial fine). */
export function primaryPhone(vendor) {
  return vendor.phones?.[0] || null;
}

/** WhatsApp-capable number (mobile only), or null if the vendor is call-only. */
export function primaryWhatsapp(vendor) {
  return vendor.whatsapp?.[0] || null;
}

/** tel: link for the dialer. */
export function telLink(phone) {
  return `tel:${(phone || '').replace(/[^0-9+]/g, '')}`;
}

/**
 * wa.me deep link with a pre-filled, polite enquiry. `treatment` (a product/
 * disease context) tailors the message; without it we send a generic enquiry
 * (used for service vendors like mechanization/drones).
 */
export function whatsappLink(vendor, { number, treatment, category, lang = 'en' } = {}) {
  const num = (number || primaryWhatsapp(vendor) || '').replace(/[^0-9]/g, '');
  const isProduct = !category || PRODUCT_CATEGORIES.has(category);
  let msg;
  if (treatment && isProduct) {
    msg = lang === 'twi'
      ? `Agoo ${vendor.name}, merehwehwɛ ${treatment} ama me mfudeɛ. Wowɔ bi? Ne boɔ ne sɛn?`
      : `Hello ${vendor.name}, I am looking for ${treatment} for my crop. Do you have it and how much is it?`;
  } else {
    msg = lang === 'twi'
      ? `Agoo ${vendor.name}, mepɛ sɛ mibisa wo nnwuma ho asɛm. Wobɛtumi aboa me?`
      : `Hello ${vendor.name}, I would like to ask about your services. Can you help me?`;
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}
