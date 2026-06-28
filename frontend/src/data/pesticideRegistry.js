/**
 * Counterfeit / banned pesticide check — cross-references the product name
 * and active ingredient extracted from a scanned label against a curated
 * list of actives known to be banned or severely restricted for
 * agricultural use in Ghana, plus the actives already used in our own
 * treatment recommendations (a reasonable "commonly registered" baseline).
 *
 * ⚠️ NOT an official, exhaustive PPRSD/EPA-Ghana registry lookup — there is
 * no public, machine-readable API for that. This is a curated reference
 * list (Stockholm Convention POPs + EPA-Ghana public restriction notices)
 * intended to catch the worst, most common offenders. Always tell the
 * farmer to confirm with their agro-dealer or PPRSD when status is unknown.
 *
 * Fully offline — pure string matching, no network call.
 */

// Actives with a public Ghana EPA / PPRSD ban or severe restriction notice,
// or banned globally under the Stockholm Convention on POPs (Ghana is a
// signatory). `match` strings are checked as case-insensitive substrings.
export const BANNED_OR_RESTRICTED = [
  {
    match: ['ddt', 'dichlorodiphenyltrichloroethane'],
    reason: {
      en: 'DDT is banned for agricultural use worldwide under the Stockholm Convention (Ghana is a signatory).',
      twi: 'DDT yɛ aduro a wɔabra ho wiase nyinaa wɔ Stockholm Convention mu (Ghana ka ho).',
    },
  },
  {
    match: ['endosulfan'],
    reason: {
      en: 'Endosulfan is banned globally under the Stockholm Convention POPs list.',
      twi: 'Endosulfan yɛ aduro a wɔabra ho wiase nyinaa wɔ Stockholm Convention POPs list mu.',
    },
  },
  {
    match: ['lindane', 'hexachlorocyclohexane', 'hch'],
    reason: {
      en: 'Lindane is banned globally under the Stockholm Convention POPs list.',
      twi: 'Lindane yɛ aduro a wɔabra ho wiase nyinaa.',
    },
  },
  {
    match: ['aldrin', 'dieldrin', 'endrin', 'chlordane', 'heptachlor', 'toxaphene', 'mirex'],
    reason: {
      en: 'This is an organochlorine pesticide banned globally under the Stockholm Convention POPs list.',
      twi: 'Yei yɛ organochlorine aduro a wɔabra ho wiase nyinaa.',
    },
  },
  {
    match: ['paraquat'],
    reason: {
      en: 'Paraquat is restricted for use in Ghana by EPA Ghana due to acute poisoning risk.',
      twi: 'EPA Ghana asi Paraquat ho ban ɛsiane sɛ ɛyɛ awuduro a ɛyɛ hu.',
    },
  },
  {
    match: ['monocrotophos', 'methyl parathion', 'parathion-methyl'],
    reason: {
      en: 'This is a highly hazardous organophosphate restricted for agricultural use in Ghana.',
      twi: 'Yei yɛ organophosphate a EPA Ghana asi ho ban ma afuo so dwumadie.',
    },
  },
  {
    match: ['carbofuran'],
    reason: {
      en: 'Carbofuran is severely restricted in Ghana due to high toxicity to humans, birds and bees.',
      twi: 'EPA Ghana asi Carbofuran ho ban ɛsiane sɛ ɛyɛ awuduro a ano yɛ den ma nnipa, nnomaa ne nwowa.',
    },
  },
];

// Actives already behind our own treatment recommendations — a reasonable
// "commonly registered for use in Ghana" baseline. Not exhaustive.
export const COMMONLY_REGISTERED = [
  'copper hydroxide', 'copper', 'kocide', 'mancozeb', 'tebuconazole',
  'chlorothalonil', 'sulfur', 'sulphur', 'chlorpyrifos', 'aflasafe',
  'imidacloprid', 'confidor', 'thiamethoxam', 'actara', 'neem',
];

function matchesAny(haystack, needles) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

/**
 * @param {{ productName?: string, activeIngredient?: string }} label
 * @returns {{ status: 'banned'|'registered'|'unknown', reason?: {en,twi} }}
 */
export function checkPesticideStatus({ productName = '', activeIngredient = '' } = {}) {
  const text = `${productName} ${activeIngredient}`.trim();
  if (!text) return { status: 'unknown' };

  for (const entry of BANNED_OR_RESTRICTED) {
    if (matchesAny(text, entry.match)) {
      return { status: 'banned', reason: entry.reason };
    }
  }
  if (matchesAny(text, COMMONLY_REGISTERED)) {
    return { status: 'registered' };
  }
  return { status: 'unknown' };
}
