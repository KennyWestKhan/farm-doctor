import { useLang } from '../i18n.jsx';
import { FARM_SIZE_PRESETS, MIN_LOADS, MAX_LOADS } from '../data/farmSize.js';

/**
 * "How many loads to spray your whole farm?" picker.
 *
 * Deliberately doesn't assume a standard bucket size — it asks for a count of
 * however many times the farmer fills and empties THE SAME container they
 * already mix one batch in, which is self-consistent regardless of whether
 * that container is a small bucket, a Veronica bucket, or a 15L knapsack
 * sprayer tank. Designed to need zero reading: the preset buttons show the
 * answer as a literal count of bucket emoji (more buckets drawn = bigger
 * farm), and the +/- stepper is icon-only. The number itself is still shown
 * for farmers who do read, but nothing here requires it.
 */
export default function FarmSizePicker({ loads, onChange }) {
  const { t, pick } = useLang();
  const dec = () => onChange(Math.max(MIN_LOADS, loads - 1));
  const inc = () => onChange(Math.min(MAX_LOADS, loads + 1));

  return (
    <div className="card stack">
      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>🪣 {t('farmsize_title')}</strong>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t('farmsize_subtitle')}</p>

      <div className="row" style={{ gap: 8 }}>
        {FARM_SIZE_PRESETS.map((p) => {
          const active = loads === p.loads;
          // Cap the drawn icons so "large" doesn't overflow a narrow screen —
          // the count still grows visually (1 → 3 → 4+), just not 1:1 past 4.
          const shown = Math.min(p.loads, 4);
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.loads)}
              aria-label={`${p.loads} loads, ${pick(p.acres)}`}
              style={{
                flex: 1, minHeight: 'var(--tap-min)', border: 'none', borderRadius: 'var(--radius)',
                background: active ? 'var(--green)' : 'var(--green-tint)',
                color: active ? '#fff' : 'var(--green-deep)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px',
              }}
            >
              <span style={{ fontSize: 18, letterSpacing: -2 }}>{'🪣'.repeat(shown)}{p.loads > 4 ? '+' : ''}</span>
              {/* Secondary, non-required hint for farmers who do think in
                  acres — the bucket-icon count above is the real, tappable
                  answer. Never the only way to understand the option. */}
              <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>{pick(p.acres)}</span>
            </button>
          );
        })}
      </div>

      <div className="row between" style={{ alignItems: 'center', marginTop: 2 }}>
        <button
          onClick={dec}
          aria-label="Fewer loads"
          className="icon-btn"
          style={{ width: 'var(--tap-min)', height: 'var(--tap-min)', fontSize: 28 }}
        >
          −
        </button>
        <div className="center" style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-deep)' }}>
            {loads}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>{t('farmsize_buckets_unit')}</div>
        </div>
        <button
          onClick={inc}
          aria-label="More loads"
          className="icon-btn"
          style={{ width: 'var(--tap-min)', height: 'var(--tap-min)', fontSize: 28 }}
        >
          +
        </button>
      </div>
    </div>
  );
}
