/**
 * Race a promise against a hard timeout.
 *
 * On timeout the promise rejects with an error whose `name === 'TimeoutError'`
 * — the same convention apiFetch uses — so callers can classify it the same
 * way. Without this, a stalled auth call (a dropped connection on a rural
 * network) can leave a sign-in button spinning forever with no way out.
 *
 * The original resolution/rejection is passed through untouched; only the
 * timeout adds a rejection. The timer is always cleared so a settled promise
 * never leaks a pending timeout.
 */
export function withTimeout(promise, ms, label = 'operation') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.name = 'TimeoutError';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
