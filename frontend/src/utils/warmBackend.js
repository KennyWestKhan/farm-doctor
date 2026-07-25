/**
 * Wake the backend early.
 *
 * The API runs on Render's free plan, which spins the service down after ~15 min
 * idle — the next request then eats a ~50s cold start. That's fine for a queued
 * background sync, but painful for a live diagnosis (and disastrous on a demo
 * stage). So we fire a cheap, fire-and-forget request at moments when a scan is
 * likely soon (app load, opening the camera), giving Render a head start on
 * waking before the farmer actually submits a photo.
 *
 * Uses `no-cors` so it never triggers a CORS error or needs a readable response
 * — we only care that the request reaches the server and wakes it.
 */
const API = import.meta.env.VITE_API_URL || '';

let lastWarm = 0;
const WARM_COOLDOWN_MS = 60 * 1000; // don't spam — once a minute is plenty

export function warmBackend() {
  if (!API || !navigator.onLine) return;
  const now = Date.now();
  if (now - lastWarm < WARM_COOLDOWN_MS) return;
  lastWarm = now;
  try {
    fetch(`${API}/api/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
  } catch {
    /* ignore — best-effort wake-up */
  }
}
