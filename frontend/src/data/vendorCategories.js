/**
 * Vendor categories (the 10 sheets from Complete Farmer's database), ordered
 * for the Shops filter. `key` matches the `categories[]` tags in the vendor
 * data; `i18n` is the label key in i18n.jsx; `icon` is the chip emoji.
 */
export const VENDOR_CATEGORIES = [
  { key: 'agrochemicals',  icon: '🧪', i18n: 'cat_agrochemicals' },
  { key: 'fertilizer',     icon: '🌱', i18n: 'cat_fertilizer' },
  { key: 'seeds',          icon: '🌾', i18n: 'cat_seeds' },
  { key: 'irrigation',     icon: '💧', i18n: 'cat_irrigation' },
  { key: 'mechanization',  icon: '🚜', i18n: 'cat_mechanization' },
  { key: 'tools',          icon: '🛠️', i18n: 'cat_tools' },
  { key: 'drone_spraying', icon: '🚁', i18n: 'cat_drone_spraying' },
  { key: 'motor_vehicle',  icon: '🏍️', i18n: 'cat_motor_vehicle' },
  { key: 'logistics',      icon: '📦', i18n: 'cat_logistics' },
  { key: 'labour',         icon: '👷', i18n: 'cat_labour' },
];

/** Categories that sell a physical input a farmer buys (vs. a service). Used to
 *  decide whether to show a "product enquiry" WhatsApp template. */
export const PRODUCT_CATEGORIES = new Set([
  'agrochemicals', 'fertilizer', 'seeds', 'tools', 'irrigation', 'motor_vehicle',
]);

/** The default category to surface when a farmer taps "find suppliers" from a
 *  chemical treatment on a diagnosis. */
export const TREATMENT_CATEGORY = 'agrochemicals';
