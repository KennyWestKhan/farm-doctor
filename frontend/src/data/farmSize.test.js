import { describe, it, expect } from 'vitest';
import {
  suggestLoads, parseDose, purchaseNote, formatQty, totalSprayNote,
  detectVessel, isSprayBased, MIN_LOADS, MAX_LOADS, FARM_SIZE_PRESETS, DEFAULT_ACRES,
} from './farmSize.js';

const treatment = (amount, mixing = 'Mix into water until it looks like light milo.') => ({
  farmer_instruction: { en: { amount, mixing } },
});

describe('suggestLoads', () => {
  it('scales with acres for a given crop', () => {
    expect(suggestLoads(0.75, 'chilli_pepper')).toBe(3);
    expect(suggestLoads(2, 'chilli_pepper')).toBe(8);
    expect(suggestLoads(2, 'cassava')).toBe(5);
    expect(suggestLoads(2, 'cocoa')).toBe(10);
  });

  it('uses a sane default rate for unknown crops', () => {
    expect(suggestLoads(2, 'unknown_crop')).toBe(6);
  });

  it('clamps to the stepper range', () => {
    expect(suggestLoads(0.1, 'cassava')).toBe(MIN_LOADS);
    expect(suggestLoads(100, 'cocoa')).toBe(MAX_LOADS);
  });

  it('falls back to the default farm size on bad input', () => {
    expect(suggestLoads(undefined, 'groundnut')).toBe(suggestLoads(DEFAULT_ACRES, 'groundnut'));
    expect(suggestLoads('junk', 'groundnut')).toBe(suggestLoads(DEFAULT_ACRES, 'groundnut'));
  });

  it('every preset yields a valid suggestion for every known crop', () => {
    for (const p of FARM_SIZE_PRESETS) {
      for (const crop of ['chilli_pepper', 'cassava', 'sweet_potato', 'groundnut', 'ginger', 'cocoa']) {
        const n = suggestLoads(p.acres, crop);
        expect(n).toBeGreaterThanOrEqual(MIN_LOADS);
        expect(n).toBeLessThanOrEqual(MAX_LOADS);
      }
    }
  });
});

describe('parseDose', () => {
  it('reads bottle-cap powder doses', () => {
    expect(parseDose(treatment('Use one bottle cap of powder for one bucket of water.')))
      .toEqual({ qty: 1, unit: 'cap', material: 'powder' });
    expect(parseDose(treatment('Two bottle caps of powder per bucket of water.')))
      .toEqual({ qty: 2, unit: 'cap', material: 'powder' });
  });

  it('reads doses that carry a metric bracket after the analogy', () => {
    expect(parseDose(treatment('Two bottle caps (about 10 g) of powder per bucket of water.')))
      .toEqual({ qty: 2, unit: 'cap', material: 'powder' });
    expect(parseDose(treatment('One handful (about 30 g) of crushed neem seeds per bucket of water.')))
      .toEqual({ qty: 1, unit: 'handful', material: 'neem' });
  });

  it('reads sulfur powder as powder', () => {
    expect(parseDose(treatment('Two bottle caps (about 10 g) of sulfur powder per bucket of water.')))
      .toEqual({ qty: 2, unit: 'cap', material: 'powder' });
  });

  it('reads half-cap liquid doses', () => {
    expect(parseDose(treatment('Half a bottle cap of liquid per bucket of water.')))
      .toEqual({ qty: 0.5, unit: 'cap', material: 'liquid' });
    expect(parseDose(treatment('Half a bottle cap (about 2.5 ml) of liquid per bucket of water.')))
      .toEqual({ qty: 0.5, unit: 'cap', material: 'liquid' });
  });

  it('reads neem handful doses', () => {
    expect(parseDose(treatment('One handful of crushed neem seeds per bucket of water.')))
      .toEqual({ qty: 1, unit: 'handful', material: 'neem' });
  });

  it('refuses ambiguous combo recipes ("of each")', () => {
    expect(parseDose(treatment('One bottle cap of each powder for one bucket of water.'))).toBeNull();
  });

  it('refuses cultural-control and unrecognised wording', () => {
    expect(parseDose(treatment('Pull out and burn every sick plant so it does not spread.'))).toBeNull();
    expect(parseDose(treatment('A pinch (three-finger pinch) of powder at the base of each plant.'))).toBeNull();
  });
});

describe('formatQty', () => {
  it('renders halves the way farmers count caps', () => {
    expect(formatQty(0.5)).toBe('½');
    expect(formatQty(1)).toBe('1');
    expect(formatQty(1.5)).toBe('1½');
    expect(formatQty(6)).toBe('6');
  });
});

describe('purchaseNote', () => {
  it('multiplies the per-load dose by loads and brackets the metric total', () => {
    const note = purchaseNote(3, treatment('Two bottle caps (about 10 g) of powder per bucket of water.'));
    expect(note.en).toContain('6 bottle caps of powder');
    expect(note.en).toContain('(about 30 g)');
    expect(note.twi).toContain('(bɛyɛ 30 g)');
  });

  it('handles half-cap totals in ml for liquids', () => {
    const note = purchaseNote(3, treatment('Half a bottle cap (about 2.5 ml) of liquid per bucket of water.'));
    expect(note.en).toContain('1½ bottle caps of liquid');
    expect(note.en).toContain('(about 7.5 ml)');
  });

  it('handles handfuls with a gram total', () => {
    const note = purchaseNote(4, treatment('One handful (about 30 g) of crushed neem seeds per bucket of water.'));
    expect(note.en).toContain('4 handfuls of crushed neem seeds');
    expect(note.en).toContain('(about 120 g)');
  });

  it('returns null when the dose is unparseable, so no wrong number ever shows', () => {
    expect(purchaseNote(3, treatment('One bottle cap of each powder for one bucket of water.'))).toBeNull();
  });
});

describe('existing helpers (regression)', () => {
  it('totalSprayNote singular/plural', () => {
    expect(totalSprayNote(1).en).toContain('once');
    expect(totalSprayNote(3).en).toContain('3 times');
    expect(totalSprayNote(3, 'knapsack').en).toContain('knapsack sprayer loads');
  });

  it('detectVessel picks knapsack only when the recipe says so', () => {
    expect(detectVessel(treatment('One sachet per knapsack sprayer of water.'))).toBe('knapsack');
    expect(detectVessel(treatment('Two bottle caps of powder per bucket of water.'))).toBe('bucket');
  });

  it('isSprayBased hides totals for cultural controls', () => {
    expect(isSprayBased(treatment('n/a', 'No mixing — this is a field practice.'))).toBe(false);
    expect(isSprayBased(treatment('n/a', 'Mix until the water looks like light milo.'))).toBe(true);
  });
});
