/**
 * Farm-size → spray quantity scaling (hybrid "suggest + adjust").
 *
 * Every treatment's mixing instruction in diseaseDatabase.js is written as a
 * CONCENTRATION ("one bottle cap per bucket of water"), not a total quantity.
 * The farmer picks their FARM SIZE (acre-range presets); the app then
 * SUGGESTS how many sprayer/bucket loads that means for the diagnosed crop,
 * and computes what that implies: how many times to mix the recipe and
 * roughly how much chemical to buy in total. The farmer can always override
 * the suggested load count with the +/- stepper — container sizes and spray
 * habits vary, and an experienced farmer's own number beats our estimate.
 *
 * The load suggestion assumes a ~15 L knapsack sprayer (the dominant vessel
 * in Ghanaian smallholder spraying) at typical smallholder spray volumes.
 * That assumption is stated in the UI next to the stepper, never hidden.
 *
 * The total note names the right vessel word per treatment (most say
 * "bucket"; the cocoa COCOBOD-spray entries say "knapsack sprayer") so the
 * wording matches what that specific recipe actually told the farmer to mix
 * in, rather than forcing every treatment into "bucket" terminology.
 */

// Acre-range presets. `acres` is the representative value used for the load
// suggestion; `label` is what the farmer sees. Ranges reflect typical
// Ghanaian smallholder plot sizes (~1.2 ha / ~3 acres average).
export const FARM_SIZE_PRESETS = [
  { id: 'small', acres: 0.75, label: { en: '~½–1 acre', twi: '~ɛka ½–1' } },
  { id: 'medium', acres: 2, label: { en: '~1–3 acres', twi: '~ɛka 1–3' } },
  { id: 'large', acres: 4, label: { en: '~3+ acres', twi: '~ɛka 3+' } },
];

export const DEFAULT_ACRES = FARM_SIZE_PRESETS[1].acres;
export const MIN_LOADS = 1;
export const MAX_LOADS = 20;

// Rough loads-per-acre for a ~15 L knapsack load, by crop. Derived from
// typical smallholder foliar spray volumes (~100–200 L/ha depending on
// canopy): dense-canopy vegetables and tall cocoa need more passes per acre
// than low root crops. Deliberately coarse — this feeds a SUGGESTION the
// farmer can override, not a promise.
const LOADS_PER_ACRE = {
  chilli_pepper: 4,
  cassava: 2.5,
  sweet_potato: 2.5,
  groundnut: 3,
  ginger: 3,
  cocoa: 5,
};
const DEFAULT_LOADS_PER_ACRE = 3;

/** Suggested number of loads to spray `acres` of `cropId`, clamped to the stepper range. */
export function suggestLoads(acres, cropId) {
  const rate = LOADS_PER_ACRE[cropId] || DEFAULT_LOADS_PER_ACRE;
  const n = Math.round((Number(acres) || DEFAULT_ACRES) * rate);
  return Math.min(MAX_LOADS, Math.max(MIN_LOADS, n));
}

const VESSEL_WORDS = {
  bucket: { en: { one: 'bucket', many: 'buckets' }, twi: { one: 'bokiti', many: 'mmokiti' } },
  // "Sprayer" is used as a loanword in the existing Twi treatment text for
  // knapsack-sprayer recipes (see diseaseDatabase.js) — kept consistent here.
  knapsack: { en: { one: 'knapsack sprayer load', many: 'knapsack sprayer loads' }, twi: { one: 'sprayer pɛnkoro', many: 'sprayer' } },
};

/**
 * Which vessel word a treatment's own instructions actually use, so the total
 * note doesn't tell a farmer "buckets" when their recipe says "knapsack
 * sprayer." Falls back to "bucket" — the dominant unit across the database.
 */
export function detectVessel(treatment) {
  const text = `${treatment.farmer_instruction.en.amount} ${treatment.farmer_instruction.en.mixing}`;
  return /knapsack/i.test(text) ? 'knapsack' : 'bucket';
}

/**
 * Whether a treatment involves spraying/mixing at all (vs. cultural controls
 * like crop rotation, removing infected plants, mulching, or relying on
 * natural predators) — those don't have a "total for your farm" quantity to
 * scale, so the farm-size total is meaningless for them and must be hidden.
 */
export function isSprayBased(treatment) {
  const mixing = treatment.farmer_instruction.en.mixing;
  return !/no medicine|no mixing|no spraying needed/i.test(mixing);
}

/** Bilingual "what this means for your whole farm" line for a given treatment. */
export function totalSprayNote(loads, vessel = 'bucket') {
  const words = VESSEL_WORDS[vessel] || VESSEL_WORDS.bucket;
  if (loads <= 1) {
    return {
      en: `Mix this recipe once — about 1 ${words.en.one} covers your farm.`,
      twi: `Fra saa nnuro yi pɛnkoro — bɛyɛ ${words.twi.one} bɛkata wo afuo so.`,
    };
  }
  return {
    en: `Mix this same recipe ${loads} times — about ${loads} ${words.en.many} to cover your whole farm.`,
    twi: `Fra saa nnuro yi mpɛn ${loads} — bɛyɛ ${words.twi.many} ${loads} de bɛkata wo afuo nyinaa so.`,
  };
}

// ---- Per-load dose parsing → total-to-buy guidance -------------------------

const NUM_WORDS = { a: 1, one: 1, two: 2, three: 3, four: 4 };

// Metric equivalents behind the analogies, shown in brackets so literate
// farmers and agro-dealers can verify against the product label. Deliberately
// coarse ("about") — a level soda-bottle cap of wettable powder is ~5 g, the
// same cap of liquid ~5 ml, a handful of crushed seeds ~30 g.
const CAP_POWDER_G = 5;
const CAP_LIQUID_ML = 5;
const HANDFUL_G = 30;

/**
 * Parse the per-load chemical dose out of a treatment's English `amount`
 * text ("Two bottle caps of powder per bucket of water" → 2 caps of powder).
 * Parsing free text is inherently fragile, so this is strictly best-effort:
 * anything it can't confidently read (including "one cap of EACH powder"
 * combo recipes) returns null and the UI simply shows no purchase line —
 * it can never show a wrong number for an unrecognised wording.
 * Only the English text is parsed; it is the canonical source and always
 * present, regardless of UI language.
 */
export function parseDose(treatment) {
  const text = treatment.farmer_instruction.en.amount;
  if (/of each/i.test(text)) return null; // combo recipes: ambiguous total, skip

  // The amount text may carry a metric bracket after the analogy — e.g.
  // "Two bottle caps (about 10 g) of powder" — so allow an optional (...)
  // between the measure and its material.
  let m = /(half a|½|a|one|two|three|four)\s+bottle caps?\s*(?:\([^)]*\))?\s+of\s+(?:sulfur\s+)?(powder|liquid)/i.exec(text);
  if (m) {
    const w = m[1].toLowerCase();
    const qty = w === '½' || w === 'half a' ? 0.5 : NUM_WORDS[w];
    return qty ? { qty, unit: 'cap', material: m[2].toLowerCase() } : null;
  }

  m = /(a|one|two|three|four)\s+handfuls?\s*(?:\([^)]*\))?\s+of\s+crushed neem seeds/i.exec(text);
  if (m) {
    const qty = NUM_WORDS[m[1].toLowerCase()];
    return qty ? { qty, unit: 'handful', material: 'neem' } : null;
  }

  return null;
}

/** "1", "½", "1½", "3" — farmers count caps in halves, not decimals. */
export function formatQty(n) {
  const whole = Math.floor(n);
  const half = n - whole >= 0.5;
  if (whole === 0) return half ? '½' : '0';
  return half ? `${whole}½` : String(whole);
}

/*
 * Twi (native-speaker review requested — new strings 2026-07-02):
 * "Deɛ wobɛtɔ" = "what you should buy"; mfutuma = powder; existing DB uses
 * "toa ano" for bottle cap and "nsatea" for handful, kept consistent here.
 */
const MATERIAL_TWI = { powder: 'mfutuma', liquid: 'nsuo aduro' };

/**
 * Bilingual "how much to buy in total" line, or null when the dose text
 * couldn't be parsed (the mix-N-times note still shows in that case).
 */
export function purchaseNote(loads, treatment) {
  const dose = parseDose(treatment);
  if (!dose) return null;
  const total = dose.qty * loads;
  const qty = formatQty(total);

  if (dose.unit === 'handful') {
    const grams = total * HANDFUL_G;
    return {
      en: `To buy: about ${qty} handful${total > 1 ? 's' : ''} of crushed neem seeds in total (about ${grams} g).`,
      twi: `Deɛ wobɛtɔ: nsatea ${qty} neem aba a wɔadwira nyinaa (bɛyɛ ${grams} g).`,
    };
  }
  // The bracketed metric total lets a literate farmer or agro-dealer verify
  // the analogy against the product label / sachet weight.
  const metric = dose.material === 'liquid'
    ? `${total * CAP_LIQUID_ML} ml`
    : `${total * CAP_POWDER_G} g`;
  return {
    en: `To buy: about ${qty} bottle cap${total > 1 ? 's' : ''} of ${dose.material} in total (about ${metric}).`,
    twi: `Deɛ wobɛtɔ: toa ano ${MATERIAL_TWI[dose.material] || dose.material} bɛyɛ ${qty} nyinaa (bɛyɛ ${metric}).`,
  };
}
