/**
 * Offline symptom matcher.
 *
 * The farmer answers a checklist of YES/NO/UNSURE questions. We score each disease
 * for the selected crop by summing the weights of the symptoms they confirmed,
 * normalised by the total weight that disease could have scored. The result is a
 * confidence 0..1 per disease.
 *
 * This runs 100% on-device — no network. It is the FIRST tier of diagnosis.
 * When the top confidence is below CONFIDENCE_THRESHOLD, the caller should queue
 * the photo for Claude Vision (the second, online tier).
 */

import { getCrop, REGIONS } from '../data/diseaseDatabase';

export const CONFIDENCE_THRESHOLD = 0.7;

// Answer values the UI provides per question key.
export const ANSWER = { YES: 'yes', NO: 'no', UNSURE: 'unsure' };

/**
 * @param {string} cropId
 * @param {Record<string, 'yes'|'no'|'unsure'>} answers  keyed by symptom question key
 * @returns {Array<{disease, confidence, matchedWeight, possibleWeight, hitCount}>}
 *          ranked high→low confidence
 */
export function scoreDiseases(cropId, answers) {
  const crop = getCrop(cropId);
  if (!crop) return [];

  return crop.diseases
    .map((disease) => {
      let matched = 0;
      let possible = 0;
      let hitCount = 0;

      for (const symptom of disease.symptoms) {
        possible += symptom.weight;
        const answer = answers[symptom.key];
        if (answer === ANSWER.YES) {
          matched += symptom.weight;
          hitCount += 1;
        }
        // NO and UNSURE contribute 0 to matched. UNSURE still counts toward
        // `possible` so guessing "unsure" on everything can't inflate confidence.
      }

      const confidence = possible > 0 ? matched / possible : 0;
      return { disease, confidence, matchedWeight: matched, possibleWeight: possible, hitCount };
    })
    .filter((r) => r.hitCount > 0) // ignore diseases with zero confirmed symptoms
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Full offline diagnosis decision.
 *
 * @returns {{
 *   status: 'confident' | 'uncertain' | 'no_match',
 *   top: object|null,
 *   ranked: Array,
 *   needsVision: boolean,        // true → queue photo for Claude Vision when online
 *   regionalNote: object|null    // {en, twi} risk note if region/season align
 * }}
 */
export function diagnoseOffline(cropId, answers, region = null, date = new Date()) {
  const ranked = scoreDiseases(cropId, answers);

  if (ranked.length === 0) {
    return { status: 'no_match', top: null, ranked, needsVision: true, regionalNote: null };
  }

  const top = ranked[0];
  const confident = top.confidence >= CONFIDENCE_THRESHOLD;

  return {
    status: confident ? 'confident' : 'uncertain',
    top,
    ranked,
    needsVision: !confident,
    regionalNote: confident ? buildRegionalNote(top.disease, region, date) : null,
  };
}

/**
 * Builds a "this is high risk in your area right now" note when the farmer's
 * region has high/medium prevalence AND the current month is in the disease's
 * season. Returns null when there's nothing notable to say.
 */
export function buildRegionalNote(disease, region, date = new Date()) {
  if (!region || !disease.regional_prevalence) return null;

  const prevalence = disease.regional_prevalence[region];
  if (!prevalence || prevalence === 'low') return null;

  const month = date.getMonth() + 1; // 1..12
  const inSeason = disease.seasonal_months?.includes(month);
  if (!inSeason) return null;

  const regionName = REGIONS[region]?.en || region;
  const regionNameTwi = REGIONS[region]?.twi || region;
  const monthName = MONTHS_EN[month - 1];
  const isPeak = disease.peak_month === month;
  const level = prevalence === 'high' ? 'VERY COMMON' : 'common';
  const levelTwi = prevalence === 'high' ? 'taa ba' : 'ba';

  return {
    en: `This disease is ${level} in ${regionName} during ${monthName}.${
      isPeak ? ' This is its peak month.' : ''
    } You are at HIGH RISK right now.`,
    twi: `Saa yadeɛ yi ${levelTwi} wɔ ${regionNameTwi} wɔ ${monthName} mu.${
      isPeak ? ' Saa bosome yi mu na ɛyɛ den paa.' : ''
    } Wowɔ asiane mu seesei ara.`,
  };
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
