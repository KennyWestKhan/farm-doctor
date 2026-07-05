import { describe, it, expect } from 'vitest';
import { classifyAuthError } from './authErrors.js';

// Runs under vitest's Node environment (no `navigator`), which exercises the
// `typeof navigator !== 'undefined'` guard. In a real browser the offline case
// also fires the same way `fetch` reports it — a "Failed to fetch" TypeError —
// which is covered directly below.
describe('classifyAuthError', () => {
  it('detects timeout by error name', () => {
    const err = new Error('Google sign-in timed out');
    err.name = 'TimeoutError';
    expect(classifyAuthError(err)).toBe('timeout');
  });

  it('treats fetch/network failures as offline', () => {
    expect(classifyAuthError(new TypeError('Failed to fetch'))).toBe('offline');
    expect(classifyAuthError(new Error('Load failed'))).toBe('offline');
    expect(classifyAuthError(new Error('network request failed'))).toBe('offline');
  });

  it('flags invalid/expired credentials', () => {
    expect(classifyAuthError({ message: 'Token has expired or is invalid' })).toBe('invalid');
  });

  it('falls back to generic for unknown or empty errors', () => {
    expect(classifyAuthError(new Error('something odd'))).toBe('generic');
    expect(classifyAuthError(null)).toBe('generic');
    expect(classifyAuthError(undefined)).toBe('generic');
  });
});
