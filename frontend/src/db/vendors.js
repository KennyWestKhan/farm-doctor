/**
 * Vendor directory loader.
 *
 * Read order (offline-first):
 *   1. Supabase `vendors` table   — when configured + online (freshest)
 *   2. IndexedDB `vendors` cache   — last synced copy (works offline)
 *   3. bundled vendors.seed.json   — ships in the app, so the very first load
 *                                    works even with no network and empty cache
 *
 * The bundled seed is REDACTED (no contactPerson/emails — see build-vendors.py):
 * those personal fields live only in Supabase and arrive via path 1, then get
 * cached (path 2). So a cold offline first-load shows business name + phones +
 * location; contact person + email appear once the app has synced from Supabase.
 *
 * Data is Complete Farmer's compiled vendor database, cleaned by
 * scripts/build-vendors.py. The full seed SQL (supabase/vendors.sql) is
 * gitignored because it contains that PII.
 */
import seed from '../data/vendors.seed.json';
import { supabase } from './supabase';
import { db } from './favorites';

// Map a Supabase row (snake_case) to the app's camelCase vendor shape, which
// matches vendors.seed.json exactly so the rest of the app is source-agnostic.
function fromRow(r) {
  return {
    id: r.id,
    name: r.name,
    contactPerson: r.contact_person ?? null,
    phones: r.phones ?? [],
    whatsapp: r.whatsapp ?? [],
    emails: r.emails ?? [],
    categories: r.categories ?? [],
    subcategories: r.subcategories ?? [],
    crops: r.crops ?? [],
    services: r.services ?? [],
    addressText: r.address_text ?? null,
    area: r.area ?? null,
    region: r.region ?? null,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    source: r.source ?? 'complete-farmer-db',
  };
}

/**
 * Resolve the vendor list. Never rejects — always returns an array (falls back
 * to the bundled seed) so the Shops UI can render regardless of network state.
 */
export async function getVendors() {
  const d = await db();

  if (supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase.from('vendors').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const mapped = data.map(fromRow);
        const tx = d.transaction('vendors', 'readwrite');
        await tx.store.clear();
        for (const v of mapped) await tx.store.put(v);
        await tx.done;
        return mapped;
      }
    } catch {
      // network/query error — fall through to cache/seed
    }
  }

  try {
    const cached = await d.getAll('vendors');
    if (cached.length) return cached;
  } catch {
    // IDB unavailable (private mode) — fall through to seed
  }

  return seed;
}
