const API = import.meta.env.VITE_API_URL || '';
const DEVICE_ID_KEY = 'fd_device_id';

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

export function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
    ...options.headers,
  };
  return fetch(`${API}${path}`, { ...options, headers });
}
