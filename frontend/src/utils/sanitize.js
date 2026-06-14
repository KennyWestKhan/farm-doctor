/**
 * Input validation & sanitization.
 *
 * Two threat surfaces we guard against:
 *  1. THE SYSTEM (XSS / storage / display): strip control characters, cap length,
 *     normalise. We never render user text as HTML (React escapes by default),
 *     but we still clean it before storing or sending.
 *  2. THE LLM (prompt injection): zero-width and bidirectional-override
 *     characters are a common way to smuggle hidden instructions past a human
 *     reviewer and into a model. We remove them. The PRIMARY defence is
 *     structural (see backend prompt.js): user text is always passed as a
 *     separate user-role message (data), never concatenated into the system
 *     prompt. Sanitization here is defence-in-depth, not the only line.
 *
 * We test characters by numeric code point (not regex literals) so the source
 * file contains no literal control bytes.
 */

export const LIMITS = {
  query: 80, // home search box
  note: 280, // "did it work?" farmer note
  generic: 500,
};

// Should this code point be stripped from short farmer text?
function isUnsafeCodePoint(code) {
  // C0 control chars, but keep TAB (9) and LF (10).
  if (code <= 0x1f) return code !== 0x09 && code !== 0x0a;
  // DEL + C1 control chars.
  if (code >= 0x7f && code <= 0x9f) return true;
  // Zero-width space/joiners + LRM/RLM.
  if (code >= 0x200b && code <= 0x200f) return true;
  // Bidirectional embedding/override controls.
  if (code >= 0x202a && code <= 0x202e) return true;
  // Word joiner.
  if (code === 0x2060) return true;
  // Bidirectional isolates.
  if (code >= 0x2066 && code <= 0x2069) return true;
  // Zero-width no-break space / BOM.
  if (code === 0xfeff) return true;
  return false;
}

/**
 * Clean a free-text value: normalise unicode, drop control/invisible chars,
 * collapse whitespace, trim, and hard-cap length.
 * @returns {string} safe text (possibly empty)
 */
export function sanitizeText(raw, maxLen = LIMITS.generic) {
  if (typeof raw !== 'string') return '';
  let out = '';
  for (const ch of raw.normalize('NFC')) {
    out += isUnsafeCodePoint(ch.codePointAt(0)) ? ' ' : ch;
  }
  out = out.replace(/\s+/g, ' ').trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).trim();
  return out;
}

/**
 * Validate + sanitize, returning a structured result for UI feedback.
 * @returns {{ ok: boolean, value: string, reason?: string }}
 */
export function validateText(raw, { maxLen = LIMITS.generic, minLen = 1 } = {}) {
  const value = sanitizeText(raw, maxLen);
  if (value.length < minLen) return { ok: false, value, reason: 'empty' };
  // Reject strings with no letters/digits in any script (only symbols/punctuation).
  if (!/[\p{L}\p{N}]/u.test(value)) return { ok: false, value, reason: 'no_content' };
  return { ok: true, value };
}
