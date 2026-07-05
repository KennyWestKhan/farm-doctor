/**
 * Reduce any auth failure to a small, translatable set of kinds so the UI can
 * show a farmer-friendly message instead of raw Supabase/network text.
 *   offline  — no connection (or a fetch/network error)
 *   timeout  — our own auth timeout elapsed (name === 'TimeoutError')
 *   invalid  — bad/expired code or credentials
 *   generic  — anything else
 * ('config', used when Supabase isn't set up, is produced directly by callers
 *  and maps to the generic message in the UI.)
 */
export function classifyAuthError(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  if (err?.name === 'TimeoutError') return 'timeout';
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) return 'offline';
  if (msg.includes('invalid') || msg.includes('expired') || msg.includes('token')) return 'invalid';
  return 'generic';
}
