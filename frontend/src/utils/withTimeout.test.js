import { describe, it, expect } from 'vitest';
import { withTimeout } from './withTimeout.js';

describe('withTimeout', () => {
  it('resolves when the promise settles before the timeout', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('rejects with a TimeoutError when the promise is too slow', async () => {
    const slow = new Promise((r) => setTimeout(() => r('late'), 50));
    await expect(withTimeout(slow, 5, 'test')).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('passes through the original rejection unchanged', async () => {
    const boom = Promise.reject(new Error('boom'));
    await expect(withTimeout(boom, 1000)).rejects.toThrow('boom');
  });

  it('includes the label in the timeout message', async () => {
    const slow = new Promise((r) => setTimeout(r, 50));
    await expect(withTimeout(slow, 5, 'Google sign-in')).rejects.toThrow(/Google sign-in/);
  });
});
