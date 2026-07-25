import { describe, it, expect } from 'vitest';
import { evaluate, buildCleanCases, REALISTIC_CASES, LABELED_CASES } from './matcherBench';

/**
 * Offline-matcher accuracy benchmark.
 *
 * Prints a full report (run `npm run bench:matcher` to see it) AND asserts
 * thresholds so accuracy can't silently regress when the disease DB changes.
 */

const pct = (x) => `${(x * 100).toFixed(1)}%`;

function printReport(title, m) {
  const lines = [
    `\n${title}`,
    '─'.repeat(title.length),
    `  cases:              ${m.total} (${m.labeledN} labelled)`,
    `  top-1 accuracy:     ${pct(m.top1Acc)}  (${m.top1}/${m.labeledN})`,
    `  top-3 accuracy:     ${pct(m.top3Acc)}  (${m.top3}/${m.labeledN})`,
    `  confident tier:     ${m.confidentN} preds, ${pct(m.confidentPrecision)} precision (${m.confCorrect}/${m.confidentN})`,
    m.deferN ? `  defer-to-AI recall: ${pct(m.deferRecall)}  (${m.deferCorrect}/${m.deferN})` : null,
    `  mean confidence:    ${pct(m.meanConfCorrect)} correct vs ${m.top1 === m.labeledN ? 'n/a (no misses)' : pct(m.meanConfWrong) + ' wrong'}`,
    `  per crop:           ${Object.entries(m.perCrop).map(([k, v]) => `${k} ${v.correct}/${v.n}`).join('  ')}`,
    m.confusions.length
      ? `  misses:\n${m.confusions.map((c) => `     • ${c.id}: want ${c.expected}, got ${c.predicted || 'none'} (${c.conf}, ${c.status})`).join('\n')}`
      : '  misses:             none',
  ].filter(Boolean);
  console.log(lines.join('\n'));
}

describe('offline matcher accuracy benchmark', () => {
  const clean = evaluate(buildCleanCases());
  const realistic = evaluate(REALISTIC_CASES);
  const all = evaluate(LABELED_CASES);

  it('prints the accuracy report', () => {
    printReport('CLEAN (textbook full-symptom profiles)', clean);
    printReport('REALISTIC (partial / noisy / ambiguous reports)', realistic);
    printReport('ALL combined', all);
    expect(all.labeledN).toBeGreaterThan(0);
  });

  it('recovers every disease from its full symptom profile (clean top-1 = 100%)', () => {
    expect(clean.top1Acc).toBe(1);
  });

  it('clean profiles are all confidently ranked (no false deferrals)', () => {
    expect(clean.confidentPrecision).toBe(1);
  });

  it('realistic top-1 accuracy stays high', () => {
    expect(realistic.top1Acc).toBeGreaterThanOrEqual(0.9);
  });

  it('confident-tier predictions are precise (few confident mistakes)', () => {
    expect(all.confidentPrecision).toBeGreaterThanOrEqual(0.95);
  });

  it('genuinely ambiguous reports defer to the AI', () => {
    expect(realistic.deferRecall).toBe(1);
  });

  it('is well calibrated — higher confidence when right than when wrong', () => {
    expect(all.meanConfCorrect).toBeGreaterThan(all.meanConfWrong);
  });
});
