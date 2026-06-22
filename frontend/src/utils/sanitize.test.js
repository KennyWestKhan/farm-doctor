import { describe, it, expect } from 'vitest';
import { sanitizeText, validateText, LIMITS } from './sanitize.js';

// ---------------------------------------------------------------------------
// sanitizeText
// ---------------------------------------------------------------------------
describe('sanitizeText', () => {
  it('passes clean ASCII strings through unchanged', () => {
    expect(sanitizeText('Hello world')).toBe('Hello world');
  });

  it('passes Twi/accented text through unchanged', () => {
    const twi = 'Nhaban no rebebro yɛ akokoɖradeɛ';
    expect(sanitizeText(twi)).toBe(twi);
  });

  it('strips C0 control characters (except TAB and LF)', () => {
    // \x01 = SOH, \x03 = ETX, should be replaced with space then collapsed
    expect(sanitizeText('hel\x01lo\x03world')).toBe('hel lo world');
  });

  it('preserves TAB and LF (converted to single space by whitespace collapse)', () => {
    expect(sanitizeText("line1\tline2\nline3")).toBe('line1 line2 line3');
  });

  it('strips DEL and C1 control characters', () => {
    expect(sanitizeText('ab\x7Fcd\x80ef')).toBe('ab cd ef');
  });

  it('strips zero-width spaces and joiners (U+200B..U+200F)', () => {
    expect(sanitizeText('hel​lo‍world')).toBe('hel lo world');
  });

  it('strips bidirectional override characters (U+202A..U+202E)', () => {
    expect(sanitizeText('ab‪cd‮ef')).toBe('ab cd ef');
  });

  it('strips word joiner U+2060', () => {
    expect(sanitizeText('hello⁠world')).toBe('hello world');
  });

  it('strips BOM / zero-width no-break space U+FEFF', () => {
    expect(sanitizeText('﻿Hello')).toBe('Hello');
  });

  it('strips bidirectional isolates (U+2066..U+2069)', () => {
    expect(sanitizeText('a⁦b⁩c')).toBe('a b c');
  });

  it('normalizes unicode to NFC', () => {
    // e + combining acute (NFD) should become e-acute (NFC)
    const nfd = 'café'; // cafe with combining accent
    const result = sanitizeText(nfd);
    expect(result).toBe('café');
  });

  it('enforces default length limit (500)', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeText(long).length).toBeLessThanOrEqual(LIMITS.generic);
  });

  it('enforces custom length limit', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeText(long, 50).length).toBeLessThanOrEqual(50);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('collapses multiple internal spaces to one', () => {
    expect(sanitizeText('hello    world')).toBe('hello world');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(42)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// validateText
// ---------------------------------------------------------------------------
describe('validateText', () => {
  it('accepts clean alphanumeric text', () => {
    const result = validateText('My tomato leaves');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('My tomato leaves');
  });

  it('rejects empty input', () => {
    const result = validateText('');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('empty');
  });

  it('rejects whitespace-only input', () => {
    const result = validateText('   ');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('empty');
  });

  it('rejects strings with no alphanumeric content (only punctuation/symbols)', () => {
    const result = validateText('!!! ???');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_content');
  });

  it('accepts strings with unicode letters (Twi)', () => {
    const result = validateText('ɛyɛ dɛn');
    expect(result.ok).toBe(true);
  });

  it('accepts strings with digits only', () => {
    const result = validateText('12345');
    expect(result.ok).toBe(true);
  });

  it('respects custom maxLen option', () => {
    const result = validateText('a'.repeat(100), { maxLen: LIMITS.query });
    expect(result.ok).toBe(true);
    expect(result.value.length).toBeLessThanOrEqual(LIMITS.query);
  });
});
