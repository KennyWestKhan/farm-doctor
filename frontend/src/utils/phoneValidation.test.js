import { describe, it, expect } from 'vitest';
import { formatGhanaPhone, isValidGhanaPhone } from './phoneValidation.js';

// ---------------------------------------------------------------------------
// isValidGhanaPhone
// ---------------------------------------------------------------------------
describe('isValidGhanaPhone', () => {
  it('accepts a valid 12-digit Ghana number with +', () => {
    expect(isValidGhanaPhone('+233501234567')).toBe(true);
  });

  it('accepts a valid number without + (digits only)', () => {
    expect(isValidGhanaPhone('233501234567')).toBe(true);
  });

  it('accepts a formatted number with spaces', () => {
    expect(isValidGhanaPhone('+233 50 123 4567')).toBe(true);
  });

  it('rejects a number that is too short', () => {
    expect(isValidGhanaPhone('+23350123')).toBe(false);
  });

  it('rejects a number that is too long', () => {
    expect(isValidGhanaPhone('+2335012345678')).toBe(false);
  });

  it('rejects a number with wrong country code', () => {
    expect(isValidGhanaPhone('+234501234567')).toBe(false); // Nigeria code
  });

  it('rejects an empty string', () => {
    expect(isValidGhanaPhone('')).toBe(false);
  });

  it('rejects the bare prefix +233', () => {
    expect(isValidGhanaPhone('+233')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatGhanaPhone
// ---------------------------------------------------------------------------
describe('formatGhanaPhone', () => {
  it('formats a full number as +233 XX XXX XXXX', () => {
    expect(formatGhanaPhone('+233501234567')).toBe('+233 50 123 4567');
  });

  it('handles partial input: just country code', () => {
    expect(formatGhanaPhone('+233')).toBe('+233');
  });

  it('handles partial input: country code + 2 digits', () => {
    expect(formatGhanaPhone('+23350')).toBe('+233 50');
  });

  it('handles partial input: country code + 5 digits', () => {
    expect(formatGhanaPhone('+23350123')).toBe('+233 50 123');
  });

  it('handles digits-only input (no +)', () => {
    expect(formatGhanaPhone('233501234567')).toBe('+233 50 123 4567');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatGhanaPhone('+233-50-123-4567')).toBe('+233 50 123 4567');
  });

  it('handles very short input (1-3 digits)', () => {
    expect(formatGhanaPhone('2')).toBe('+2');
    expect(formatGhanaPhone('23')).toBe('+23');
    expect(formatGhanaPhone('233')).toBe('+233');
  });
});
