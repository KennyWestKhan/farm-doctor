/**
 * Farm-size → spray quantity scaling.
 *
 * Every treatment's mixing instruction in diseaseDatabase.js is written as a
 * CONCENTRATION ("one bottle cap per bucket of water"), not a total quantity —
 * deliberately, because parsing free-text instructions to auto-multiply
 * bottle caps is fragile and would silently break the moment wording changes.
 *
 * We deliberately do NOT assume a standardised bucket volume — farmers' actual
 * mixing containers vary (a "bucket," a Veronica bucket, a 15L knapsack
 * sprayer tank, a jerry can). Instead we ask how many times they'd need to
 * fill and empty THE SAME container they already mix one batch in to cover
 * their whole farm — a number every farmer who has sprayed before already
 * knows from lived experience, self-consistent regardless of that
 * container's real size, and requiring no literacy or acreage math. The
 * picker is icon-counted and the +/- stepper needs no text at all.
 *
 * The total note then names the right vessel word per treatment (most say
 * "bucket"; the cocoa COCOBOD-spray entries say "knapsack sprayer") so the
 * wording matches what that specific recipe actually told the farmer to mix
 * in, rather than forcing every treatment into "bucket" terminology.
 *
 * PRESETS exist only as quick-tap starting points (most farmers will know
 * roughly where they land); the stepper lets anyone fine-tune to their exact
 * number.
 */
// `acres` is a rough, illustrative range only — real coverage per knapsack
// load varies a lot by crop spacing and how thorough the farmer sprays. It's
// shown as a secondary hint for farmers who do think in acres, never the
// primary way to choose (the bucket-icon count is). Based on typical
// Ghanaian smallholder plot sizes (~1.2ha / ~3 acres average).
export const FARM_SIZE_PRESETS = [
  { id: 'small', loads: 1, acres: { en: '~0.5–1 acre', twi: '~ɛka 0.5–1' } },
  { id: 'medium', loads: 3, acres: { en: '~1–3 acres', twi: '~ɛka 1–3' } },
  { id: 'large', loads: 6, acres: { en: '~3+ acres', twi: '~ɛka 3+' } },
];

export const MIN_LOADS = 1;
export const MAX_LOADS = 20;

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
