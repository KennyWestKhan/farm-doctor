import { useEffect, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const PING_INTERVAL = 30_000;

/**
 * Reactive online status. Combines navigator.onLine with a periodic
 * /api/health ping so the indicator reflects actual server reachability,
 * not just browser network state.
 */
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  const [serverUp, setServerUp] = useState(null); // null = unknown yet
  const timer = useRef(null);

  useEffect(() => {
    const onNet = () => setOnline(true);
    const offNet = () => { setOnline(false); setServerUp(false); };
    window.addEventListener('online', onNet);
    window.addEventListener('offline', offNet);

    function ping() {
      if (!navigator.onLine || !API) {
        setServerUp(!API ? null : false);
        return;
      }
      fetch(`${API}/api/health`, { method: 'GET', cache: 'no-store' })
        .then((r) => setServerUp(r.ok))
        .catch(() => setServerUp(false));
    }

    ping();
    timer.current = setInterval(ping, PING_INTERVAL);

    return () => {
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', offNet);
      clearInterval(timer.current);
    };
  }, []);

  // No API configured = offline-only mode, report based on network alone.
  if (!API) return online;
  // Still waiting for first ping — optimistic.
  if (serverUp === null) return online;
  return online && serverUp;
}
