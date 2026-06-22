import { describe, it, expect } from 'vitest';
import { scoreDiseases, diagnoseOffline, buildRegionalNote, CONFIDENCE_THRESHOLD, ANSWER } from './symptomMatcher.js';

// ---------------------------------------------------------------------------
// scoreDiseases
// ---------------------------------------------------------------------------
describe('scoreDiseases', () => {
  it('returns empty array for an invalid cropId', () => {
    expect(scoreDiseases('nonexistent_crop', { yellow_leaves: 'yes' })).toEqual([]);
  });

  it('returns empty array when no symptoms are confirmed (all "no")', () => {
    const answers = {
      fruit_sunken_spots: ANSWER.NO,
      fruit_rotting: ANSWER.NO,
      leaf_spots_brown: ANSWER.NO,
    };
    expect(scoreDiseases('chilli_pepper', answers)).toEqual([]);
  });

  it('returns empty array when answers object is empty', () => {
    expect(scoreDiseases('chilli_pepper', {})).toEqual([]);
  });

  it('scores a disease with full confidence when all its symptoms are YES', () => {
    // Chilli anthracnose symptoms: fruit_sunken_spots(1.0), fruit_rotting(0.8),
    // leaf_spots_brown(0.4), yellow_halo(0.3) — total 2.5
    const answers = {
      fruit_sunken_spots: ANSWER.YES,
      fruit_rotting: ANSWER.YES,
      leaf_spots_brown: ANSWER.YES,
      yellow_halo: ANSWER.YES,
    };
    const results = scoreDiseases('chilli_pepper', answers);
    const anthracnose = results.find((r) => r.disease.id === 'chilli_anthracnose');
    expect(anthracnose).toBeDefined();
    expect(anthracnose.confidence).toBeCloseTo(1.0);
    expect(anthracnose.hitCount).toBe(4);
  });

  it('ranks diseases by confidence descending', () => {
    // yellow_halo is weight 1.0 for bacterial_spot but 0.3 for anthracnose
    const answers = { yellow_halo: ANSWER.YES };
    const results = scoreDiseases('chilli_pepper', answers);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
    }
  });

  it('UNSURE answers do not add to matched weight', () => {
    const answers = {
      fruit_sunken_spots: ANSWER.UNSURE,
      fruit_rotting: ANSWER.YES,
    };
    const results = scoreDiseases('chilli_pepper', answers);
    const anthracnose = results.find((r) => r.disease.id === 'chilli_anthracnose');
    expect(anthracnose).toBeDefined();
    // Only fruit_rotting (0.8) matched out of possible 1.8 (sunken 1.0 + rotting 0.8)
    expect(anthracnose.matchedWeight).toBeCloseTo(0.8);
    expect(anthracnose.hitCount).toBe(1);
  });

  it('handles answers for symptoms not belonging to any disease gracefully', () => {
    const answers = { completely_made_up_symptom: ANSWER.YES };
    const results = scoreDiseases('chilli_pepper', answers);
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// diagnoseOffline
// ---------------------------------------------------------------------------
describe('diagnoseOffline', () => {
  it('returns confident when top score >= 0.70', () => {
    // All anthracnose symptoms YES => confidence 1.0
    const answers = {
      fruit_sunken_spots: ANSWER.YES,
      fruit_rotting: ANSWER.YES,
      leaf_spots_brown: ANSWER.YES,
      yellow_halo: ANSWER.YES,
    };
    const result = diagnoseOffline('chilli_pepper', answers);
    expect(result.status).toBe('confident');
    expect(result.needsVision).toBe(false);
    expect(result.top).toBeDefined();
    expect(result.top.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it('returns uncertain when top score > 0 but < 0.70', () => {
    // Only one low-weight symptom for anthracnose: yellow_halo = 0.3/2.5 = 0.12
    const answers = { yellow_halo: ANSWER.YES };
    const result = diagnoseOffline('chilli_pepper', answers);
    expect(result.status).toBe('uncertain');
    expect(result.needsVision).toBe(true);
    expect(result.top.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
  });

  it('returns no_match when nothing matches at all', () => {
    const result = diagnoseOffline('chilli_pepper', {});
    expect(result.status).toBe('no_match');
    expect(result.top).toBeNull();
    expect(result.ranked).toEqual([]);
    expect(result.needsVision).toBe(true);
  });

  it('returns no_match for an invalid cropId', () => {
    const result = diagnoseOffline('banana', { yellow_leaves: ANSWER.YES });
    expect(result.status).toBe('no_match');
    expect(result.top).toBeNull();
  });

  it('includes regionalNote when confident and region/season match', () => {
    const answers = {
      fruit_sunken_spots: ANSWER.YES,
      fruit_rotting: ANSWER.YES,
      leaf_spots_brown: ANSWER.YES,
      yellow_halo: ANSWER.YES,
    };
    // Anthracnose is high in ashanti, seasonal months 6-10, peak 8
    const augustDate = new Date(2026, 7, 15); // August = month index 7
    const result = diagnoseOffline('chilli_pepper', answers, 'ashanti', augustDate);
    expect(result.status).toBe('confident');
    expect(result.regionalNote).not.toBeNull();
    expect(result.regionalNote.en).toContain('VERY COMMON');
    expect(result.regionalNote.en).toContain('Ashanti');
    expect(result.regionalNote.en).toContain('August');
  });

  it('regionalNote is null when status is uncertain', () => {
    const answers = { yellow_halo: ANSWER.YES };
    const result = diagnoseOffline('chilli_pepper', answers, 'ashanti', new Date(2026, 7, 15));
    expect(result.status).toBe('uncertain');
    expect(result.regionalNote).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildRegionalNote
// ---------------------------------------------------------------------------
describe('buildRegionalNote', () => {
  // A mock disease matching chilli anthracnose structure
  const disease = {
    regional_prevalence: {
      ashanti: 'high',
      greater_accra: 'medium',
      northern: 'low',
    },
    seasonal_months: [6, 7, 8, 9, 10],
    peak_month: 8,
  };

  it('returns null when region is null', () => {
    expect(buildRegionalNote(disease, null)).toBeNull();
  });

  it('returns null when prevalence is low', () => {
    expect(buildRegionalNote(disease, 'northern', new Date(2026, 7, 15))).toBeNull();
  });

  it('returns null when outside seasonal months', () => {
    // January (month 1) is not in [6,7,8,9,10]
    expect(buildRegionalNote(disease, 'ashanti', new Date(2026, 0, 15))).toBeNull();
  });

  it('returns note with VERY COMMON for high prevalence in season', () => {
    const note = buildRegionalNote(disease, 'ashanti', new Date(2026, 7, 15)); // August
    expect(note).not.toBeNull();
    expect(note.en).toContain('VERY COMMON');
    expect(note.en).toContain('HIGH RISK');
  });

  it('returns note with common for medium prevalence in season', () => {
    const note = buildRegionalNote(disease, 'greater_accra', new Date(2026, 5, 15)); // June
    expect(note).not.toBeNull();
    expect(note.en).toContain('common');
    expect(note.en).not.toContain('VERY COMMON');
  });

  it('mentions peak month when current month is peak', () => {
    const note = buildRegionalNote(disease, 'ashanti', new Date(2026, 7, 15)); // August = peak
    expect(note.en).toContain('peak month');
  });

  it('does not mention peak month when not at peak', () => {
    const note = buildRegionalNote(disease, 'ashanti', new Date(2026, 8, 15)); // September != peak 8
    expect(note.en).not.toContain('peak month');
  });

  it('includes Twi translation', () => {
    const note = buildRegionalNote(disease, 'ashanti', new Date(2026, 7, 15));
    expect(note.twi).toBeDefined();
    expect(note.twi.length).toBeGreaterThan(0);
  });
});
