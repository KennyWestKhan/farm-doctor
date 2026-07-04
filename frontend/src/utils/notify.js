/**
 * Local diagnosis-ready notifications.
 *
 * SCOPE — this is a LOCAL notification, shown through the service-worker
 * registration (`registration.showNotification`, the only form Android Chrome
 * accepts). It fires while the PWA/tab is alive or its service worker is
 * running. It is deliberately NOT true Web Push (a server delivering a
 * notification while the app is fully closed): that needs VAPID keys, a
 * backend to store push subscriptions, and a push service — and it wouldn't
 * help here anyway, because the deferred Vision recheck that produces the
 * result only runs while the app is open (see db/sync.js).
 *
 * The high-value moment: the offline matcher was unsure, so the photo was
 * queued and re-diagnosed by Claude Vision once the network returned — which
 * can complete after the farmer has looked away. That's when we tell them.
 *
 * Twi copy here is NEW (2026-07-04) and still pending native review — see
 * TWI_REVIEW_QUEUE.pending in diseaseDatabase.js.
 */
const COPY = {
  title: { en: 'Your crop result is ready', twi: 'Wo mfudeɛ ho mmuae aba' },
  body: {
    en: 'The AI check on your crop photo is done. Open Farm Doctor to see it.',
    twi: 'AI no ahwɛ wo mfudeɛ mfonini no awie. Bue Farm Doctor na hwɛ.',
  },
};

function currentLang() {
  try {
    return localStorage.getItem('fd_lang') === 'twi' ? 'twi' : 'en';
  } catch {
    return 'en';
  }
}

/** True when the browser can show notifications through a service worker. */
export function canNotify() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

/** Current permission: 'granted' | 'denied' | 'default' | 'unsupported'. */
export function notifyPermission() {
  return canNotify() ? Notification.permission : 'unsupported';
}

/**
 * Ask for permission. MUST be called from a user gesture (e.g. a button tap)
 * so the prompt isn't auto-dismissed. Returns true only if granted.
 */
export async function ensureNotifyPermission() {
  if (!canNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Show the "your result is ready" notification, if permission was granted. */
export async function notifyDiagnosisReady() {
  if (!canNotify() || Notification.permission !== 'granted') return;
  const lang = currentLang();
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(COPY.title[lang], {
      body: COPY.body[lang],
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: lang === 'twi' ? 'ak' : 'en',
      tag: 'fd-diagnosis-ready', // coalesce: one "ready" notice at a time
    });
  } catch {
    /* service worker / notifications unavailable — silent, non-critical */
  }
}
