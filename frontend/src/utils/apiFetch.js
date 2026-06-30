const API = import.meta.env.VITE_API_URL || '';
const DEVICE_ID_KEY = 'fd_device_id';
const DEFAULT_TIMEOUT_MS = 45_000;

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch { /* private browsing */ return `anon-${Date.now()}`; }
}

/**
 * fetch() with a device-id header and a hard timeout. Without this, a stalled
 * request (dropped connection, slow backend) leaves the caller's screen stuck
 * on a loading state forever with no error and no way out. On timeout the
 * rejected error has `name === 'TimeoutError'` so callers can show a specific
 * "check your connection" message instead of a generic failure.
 */
export function apiFetch(path, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
    ...rest.headers,
  };

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError')),
    timeoutMs,
  );

  return fetch(`${API}${path}`, { ...rest, headers, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}
