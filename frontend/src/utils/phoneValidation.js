/**
 * Ghana phone number validation and formatting.
 *
 * Extracted from Welcome.jsx so the logic can be tested independently
 * and reused in other components.
 */

export function formatGhanaPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return '+' + digits;
  const rest = digits.slice(3, 12);
  const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5)].filter(Boolean);
  return '+' + digits.slice(0, 3) + ' ' + parts.join(' ');
}

export function isValidGhanaPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('233');
}
