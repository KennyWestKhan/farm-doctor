/**
 * Offline-matcher accuracy benchmark.
 *
 * The offline symptom matcher (symptomMatcher.js) is tier 1 of diagnosis — it
 * runs on-device with no network. This module measures how well it performs, so
 * we can report real metrics (poster / judging) and guard against regressions.
 *
 * Two case sets:
 *   • CLEAN cases (auto-derived): every disease answered with its full textbook
 *     symptom profile. Confirms each disease is recoverable + confidently ranked
 *     #1 — a coverage/regression check.
 *   • REALISTIC cases (hand-authored): partial, noisy and deliberately ambiguous
 *     symptom reports a real farmer might give. This is the meaningful accuracy
 *     signal, including whether the matcher correctly DEFERS to the AI (needs-
 *     Vision) when the on-device signal is genuinely too weak to be sure.
 *
 * Honest scope: these are authored from expert symptom knowledge, not labelled
 * field photos. They test the matcher's scoring/decision logic, not real-world
 * symptom-reporting accuracy — stated plainly so the numbers aren't oversold.
 */
import { ALL_DISEASES } from '../data/diseaseDatabase';
import { diagnoseOffline } from './symptomMatcher';

/** Build an answers object marking the given symptom keys as "yes". Any key not
 *  listed is treated by the matcher as not-confirmed (contributes 0). */
const Y = (...keys) => Object.fromEntries(keys.map((k) => [k, 'yes']));

/** CLEAN set: one case per disease with all of its symptoms confirmed. */
export function buildCleanCases() {
  return ALL_DISEASES.map((d) => ({
    id: `clean_${d.id}`,
    cropId: d.cropId,
    answers: Object.fromEntries(d.symptoms.map((s) => [s.key, 'yes'])),
    expected: d.id,
    kind: 'clean',
  }));
}

/**
 * REALISTIC set. `expected` = the disease the answers point to (null when the
 * report is genuinely ambiguous). `expectDefer: true` = the matcher SHOULD fall
 * below the confidence threshold and defer to Vision.
 */
export const REALISTIC_CASES = [
  // ── chilli ──────────────────────────────────────────────────────────────
  { id: 'chilli_anthracnose_partial', cropId: 'chilli_pepper', answers: Y('fruit_sunken_spots', 'fruit_rotting'), expected: 'chilli_anthracnose', kind: 'partial' },
  { id: 'chilli_bacterial_typical', cropId: 'chilli_pepper', answers: Y('yellow_halo', 'leaf_spots_brown', 'yellow_leaves'), expected: 'chilli_bacterial_spot', kind: 'typical' },
  { id: 'chilli_rust_classic', cropId: 'chilli_pepper', answers: Y('rust_pustules', 'yellow_leaves'), expected: 'chilli_rust', kind: 'typical' },
  { id: 'chilli_leafspot_target', cropId: 'chilli_pepper', answers: Y('leaf_spots_target', 'leaf_spots_brown'), expected: 'chilli_leaf_spot', kind: 'typical' },
  { id: 'chilli_ambiguous_yellowing', cropId: 'chilli_pepper', answers: Y('yellow_leaves'), expected: null, kind: 'ambiguous', expectDefer: true },

  // ── cassava ─────────────────────────────────────────────────────────────
  { id: 'cassava_brownstreak_partial', cropId: 'cassava', answers: Y('stem_streaks', 'root_dark_rot'), expected: 'cassava_brown_streak', kind: 'partial' },
  { id: 'cassava_mosaic_typical', cropId: 'cassava', answers: Y('mosaic_pattern', 'leaf_narrow_distorted', 'stunted_growth'), expected: 'cassava_mosaic', kind: 'typical' },
  { id: 'cassava_blight_partial', cropId: 'cassava', answers: Y('angular_lesions', 'leaf_wilting'), expected: 'cassava_bacterial_blight', kind: 'partial' },
  { id: 'cassava_greenmite_typical', cropId: 'cassava', answers: Y('webbing_mites', 'leaves_bunched', 'yellow_leaves'), expected: 'cassava_green_mite', kind: 'typical' },
  { id: 'cassava_ambiguous', cropId: 'cassava', answers: Y('yellow_leaves', 'stunted_growth'), expected: null, kind: 'ambiguous', expectDefer: true },

  // ── sweet potato ────────────────────────────────────────────────────────
  { id: 'sweetpotato_weevil_typical', cropId: 'sweet_potato', answers: Y('root_tunnels', 'small_insects'), expected: 'sweetpotato_weevil', kind: 'typical' },
  { id: 'sweetpotato_leafspot_partial', cropId: 'sweet_potato', answers: Y('leaf_spots_brown', 'yellow_leaves'), expected: 'sweetpotato_leafspot', kind: 'partial' },
  { id: 'sweetpotato_virus_typical', cropId: 'sweet_potato', answers: Y('vein_yellowing', 'leaf_narrow_distorted', 'stunted_growth'), expected: 'sweetpotato_virus', kind: 'typical' },
  { id: 'sweetpotato_ambiguous', cropId: 'sweet_potato', answers: Y('stunted_growth'), expected: null, kind: 'ambiguous', expectDefer: true },

  // ── groundnut ───────────────────────────────────────────────────────────
  { id: 'groundnut_leafspot_typical', cropId: 'groundnut', answers: Y('leaf_spots_brown', 'yellow_halo', 'yellow_leaves'), expected: 'groundnut_leafspot', kind: 'typical' },
  { id: 'groundnut_rust_classic', cropId: 'groundnut', answers: Y('rust_pustules', 'yellow_leaves'), expected: 'groundnut_rust', kind: 'typical' },
  { id: 'groundnut_aflatoxin_partial', cropId: 'groundnut', answers: Y('mold_on_pods'), expected: 'groundnut_aflatoxin', kind: 'partial' },
  { id: 'groundnut_rosette_typical', cropId: 'groundnut', answers: Y('leaves_bunched', 'stunted_growth', 'yellow_leaves'), expected: 'groundnut_rosette', kind: 'typical' },
  { id: 'groundnut_leafspot_vs_rust', cropId: 'groundnut', answers: Y('leaf_spots_brown', 'yellow_leaves'), expected: 'groundnut_leafspot', kind: 'confusable' },

  // ── ginger ──────────────────────────────────────────────────────────────
  { id: 'ginger_softrot_typical', cropId: 'ginger', answers: Y('rhizome_soft_rot', 'pseudostem_watersoaked', 'leaf_wilting'), expected: 'ginger_soft_rot', kind: 'typical' },
  { id: 'ginger_wilt_vs_softrot', cropId: 'ginger', answers: Y('leaf_wilting', 'yellow_leaves'), expected: 'ginger_bacterial_wilt', kind: 'confusable' },
  { id: 'ginger_rhizomerot_typical', cropId: 'ginger', answers: Y('root_dark_rot', 'yellow_leaves', 'stunted_growth'), expected: 'ginger_rhizome_rot', kind: 'typical' },
  { id: 'ginger_leafspot_partial', cropId: 'ginger', answers: Y('leaf_spots_brown', 'leaf_spots_target'), expected: 'ginger_leaf_spot', kind: 'partial' },

  // ── cocoa ───────────────────────────────────────────────────────────────
  { id: 'cocoa_blackpod_partial', cropId: 'cocoa', answers: Y('pod_black_patches', 'fruit_rotting'), expected: 'cocoa_black_pod', kind: 'partial' },
  { id: 'cocoa_swollenshoot_partial', cropId: 'cocoa', answers: Y('red_vein_banding', 'stunted_growth'), expected: 'cocoa_swollen_shoot', kind: 'partial' },
  { id: 'cocoa_capsid_typical', cropId: 'cocoa', answers: Y('capsid_lesions', 'shoot_dieback'), expected: 'cocoa_capsid', kind: 'typical' },
  { id: 'cocoa_stemborer_typical', cropId: 'cocoa', answers: Y('stem_borer_holes', 'shoot_dieback'), expected: 'cocoa_stem_borer', kind: 'typical' },
  { id: 'cocoa_ambiguous', cropId: 'cocoa', answers: Y('stunted_growth', 'yellow_leaves'), expected: null, kind: 'ambiguous', expectDefer: true },
];

export const LABELED_CASES = [...buildCleanCases(), ...REALISTIC_CASES];

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/**
 * Run the matcher over a case set and compute metrics.
 * Returns accuracy, confident-tier precision, defer recall, confidence
 * calibration, per-crop breakdown and the list of misclassifications.
 */
export function evaluate(cases) {
  const rows = cases.map((c) => {
    const res = diagnoseOffline(c.cropId, c.answers, c.region ?? null);
    return {
      c,
      predicted: res.top?.disease.id ?? null,
      top3: res.ranked.slice(0, 3).map((r) => r.disease.id),
      conf: res.top?.confidence ?? 0,
      status: res.status,
      needsVision: res.needsVision,
    };
  });

  const labeled = rows.filter((r) => r.c.expected != null);
  const isCorrect = (r) => r.predicted === r.c.expected;

  const top1 = labeled.filter(isCorrect).length;
  const top3 = labeled.filter((r) => r.top3.includes(r.c.expected)).length;

  // Confident tier: predictions the matcher was sure enough to NOT defer.
  const confRows = rows.filter((r) => r.status === 'confident');
  const confCorrect = confRows.filter((r) => r.predicted === r.c.expected).length;

  // Defer tier: ambiguous cases that SHOULD go to the AI.
  const deferRows = rows.filter((r) => r.c.expectDefer);
  const deferCorrect = deferRows.filter((r) => r.needsVision).length;

  const perCrop = {};
  for (const r of labeled) {
    const k = r.c.cropId;
    (perCrop[k] ||= { n: 0, correct: 0 });
    perCrop[k].n += 1;
    if (isCorrect(r)) perCrop[k].correct += 1;
  }

  const confusions = labeled.filter((r) => !isCorrect(r)).map((r) => ({
    id: r.c.id, expected: r.c.expected, predicted: r.predicted,
    conf: +r.conf.toFixed(2), status: r.status,
  }));

  return {
    total: cases.length,
    labeledN: labeled.length,
    top1, top1Acc: labeled.length ? top1 / labeled.length : 1,
    top3, top3Acc: labeled.length ? top3 / labeled.length : 1,
    confidentN: confRows.length,
    confCorrect,
    confidentPrecision: confRows.length ? confCorrect / confRows.length : 1,
    deferN: deferRows.length,
    deferCorrect,
    deferRecall: deferRows.length ? deferCorrect / deferRows.length : 1,
    meanConfCorrect: mean(labeled.filter(isCorrect).map((r) => r.conf)),
    meanConfWrong: mean(labeled.filter((r) => !isCorrect(r)).map((r) => r.conf)),
    perCrop,
    confusions,
  };
}
