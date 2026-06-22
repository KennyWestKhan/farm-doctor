const SCAN_COUNT_KEY = 'fd_scan_count';

export function bumpScanCount() {
  try {
    const n = parseInt(localStorage.getItem(SCAN_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(SCAN_COUNT_KEY, String(n));
    return n;
  } catch { return 0; }
}
