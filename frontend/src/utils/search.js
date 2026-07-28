/**
 * Local, offline search over the crop / disease knowledge base.
 *
 * Tokenised so a farmer can describe the problem in natural language ("my pepper
 * leaves have yellow spots and are rotting") and still surface the right disease,
 * not only when they type an exact term. We match each meaningful word against
 * crop names, disease names, descriptions and symptom questions — in English and
 * Twi — and rank by how much matched and where (a name hit beats a symptom hit),
 * with a bonus when the whole phrase appears verbatim.
 *
 * No network, no LLM: this is a safe lexical search over bundled data.
 */
import { CROPS, ALL_DISEASES, SYMPTOM_QUESTIONS } from '../data/diseaseDatabase';

const norm = (s) => (s || '').toLowerCase();

// Function words that carry no diagnostic signal — dropped so "my crop has
// yellow leaves" searches on {yellow, leaves}, not on {my, has}. Kept small on
// purpose: content words like "leaves", "spots", "rotting" must survive.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'crop', 'crops',
  'do', 'does', 'for', 'from', 'has', 'have', 'i', 'in', 'is', 'it', 'its', 'my',
  'of', 'on', 'or', 'plant', 'plants', 'so', 'the', 'their', 'them', 'there',
  'they', 'this', 'to', 'was', 'were', 'what', 'when', 'with', 'you', 'your',
]);

// Split a query into meaningful lowercase tokens (≥2 chars, no stopwords).
function tokenize(q) {
  return q
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// How many query tokens appear in a haystack (substring match gives cheap
// stemming: "spot" hits "spots", "rot" hits "rotting").
function tokenHits(tokens, hay) {
  return tokens.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
}

export function searchKnowledge(query, limit = 6) {
  const q = norm(query).trim();
  if (!q) return [];

  const tokens = tokenize(q);
  // A phrase of only stopwords / punctuation gives nothing to match on.
  if (tokens.length === 0) return [];

  const results = [];

  for (const crop of CROPS) {
    const nameHay = `${norm(crop.name.en)} ${norm(crop.name.twi)}`;
    let score = tokenHits(tokens, nameHay) * 3;
    if (nameHay.includes(q)) score += 5; // whole phrase in the name
    if (score > 0) {
      results.push({ type: 'crop', cropId: crop.id, label: crop.name, score });
    }
  }

  for (const d of ALL_DISEASES) {
    const nameHay = `${norm(d.name.en)} ${norm(d.name.twi)} ${norm(d.cropName?.en)} ${norm(d.cropName?.twi)}`;
    // Symptom question text so "yellow leaves" finds the yellowing diseases.
    const symptomText = d.symptoms
      .map((s) => `${norm(SYMPTOM_QUESTIONS[s.key]?.en)} ${norm(SYMPTOM_QUESTIONS[s.key]?.twi)}`)
      .join(' ');
    const bodyHay = `${norm(d.description?.en)} ${norm(d.description?.twi)} ${symptomText}`;

    // Name hits weigh more than body hits; the whole phrase appearing is a
    // strong signal (keeps exact-term lookups like "anthracnose" on top).
    let score = tokenHits(tokens, nameHay) * 3 + tokenHits(tokens, bodyHay);
    if (nameHay.includes(q)) score += 5;
    else if (bodyHay.includes(q)) score += 2;

    if (score > 0) {
      results.push({ type: 'disease', cropId: d.cropId, diseaseId: d.id, label: d.name, cropName: d.cropName, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
