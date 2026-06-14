/**
 * Server-side sanitization. The client sanitizes too, but the server must never
 * trust client input: anything stored or forwarded is cleaned here as well.
 *
 * Tests characters by numeric code point so this source contains no literal
 * control bytes. Mirrors frontend/src/utils/sanitize.js.
 */

function isUnsafeCodePoint(code) {
  if (code <= 0x1f) return code !== 0x09 && code !== 0x0a; // C0 except TAB/LF
  if (code >= 0x7f && code <= 0x9f) return true;            // DEL + C1
  if (code >= 0x200b && code <= 0x200f) return true;        // zero-width + LRM/RLM
  if (code >= 0x202a && code <= 0x202e) return true;        // bidi embedding/override
  if (code === 0x2060) return true;                         // word joiner
  if (code >= 0x2066 && code <= 0x2069) return true;        // bidi isolates
  if (code === 0xfeff) return true;                         // BOM
  return false;
}

export function sanitizeText(raw, maxLen = 500) {
  if (typeof raw !== 'string') return '';
  let out = '';
  for (const ch of raw.normalize('NFC')) {
    out += isUnsafeCodePoint(ch.codePointAt(0)) ? ' ' : ch;
  }
  out = out.replace(/\s+/g, ' ').trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).trim();
  return out;
}
