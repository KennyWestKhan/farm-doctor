/**
 * Local, offline search over the crop / disease knowledge base.
 *
 * Matches the (already-sanitized) query against crop names, disease names,
 * descriptions and symptom questions — in both English and Twi. Returns a small
 * ranked list of results the Home screen can link into the diagnose flow.
 *
 * No network, no LLM: this is a safe lexical search over bundled data.
 */
import { CROPS, ALL_DISEASES, SYMPTOM_QUESTIONS } from '../data/diseaseDatabase';

const norm = (s) => (s || '').toLowerCase();

export function searchKnowledge(query, limit = 6) {
  const q = norm(query);
  if (!q) return [];

  const results = [];

  for (const crop of CROPS) {
    const hay = `${norm(crop.name.en)} ${norm(crop.name.twi)}`;
    if (hay.includes(q)) {
      results.push({ type: 'crop', cropId: crop.id, label: crop.name, score: hay.startsWith(q) ? 3 : 2 });
    }
  }

  for (const d of ALL_DISEASES) {
    // Collect the disease's symptom question text so "yellow leaves" finds it.
    const symptomText = d.symptoms
      .map((s) => `${norm(SYMPTOM_QUESTIONS[s.key]?.en)} ${norm(SYMPTOM_QUESTIONS[s.key]?.twi)}`)
      .join(' ');
    const hay = `${norm(d.name.en)} ${norm(d.name.twi)} ${norm(d.description?.en)} ${symptomText}`;
    if (hay.includes(q)) {
      const inName = norm(d.name.en).includes(q) || norm(d.name.twi).includes(q);
      results.push({ type: 'disease', cropId: d.cropId, diseaseId: d.id, label: d.name, cropName: d.cropName, score: inName ? 2 : 1 });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
