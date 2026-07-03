import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { FARM_SIZE_PRESETS, MIN_LOADS, MAX_LOADS, DEFAULT_ACRES, suggestLoads } from '../data/farmSize.js';
import { getSavedFarm, setSavedFarm } from '../utils/prefs.js';

/**
 * Hybrid farm-size picker: the farmer taps their farm size (acre-range
 * presets, icon-counted so nothing requires reading), the app SUGGESTS how
 * many sprayer loads that means for this crop, and the +/- stepper lets an
 * experienced farmer override the suggestion with their own known number.
 *
 * The chosen size + confirmed load count persist to prefs, so the picker
 * comes pre-filled on the next diagnosis — but it stays visible on every
 * result, because the next diagnosis may be for a different plot.
 */
export default function FarmSizePicker({ cropId, loads, onChange }) {
  const { t, pick } = useLang();
  const [acres, setAcres] = useState(() => getSavedFarm()?.acres ?? DEFAULT_ACRES);

  const commit = (nextAcres, nextLoads) => {
    setAcres(nextAcres);
    onChange(nextLoads);
    setSavedFarm({ acres: nextAcres, loads: nextLoads, cropId });
  };
  const pickSize = (p) => commit(p.acres, suggestLoads(p.acres, cropId));
  const dec = () => commit(acres, Math.max(MIN_LOADS, loads - 1));
  const inc = () => commit(acres, Math.min(MAX_LOADS, loads + 1));

  return (
    <div className="card stack">
      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>🌾 {t('farmsize_title')}</strong>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{t('farmsize_subtitle')}</p>

      <div className="row" style={{ gap: 8 }}>
        {FARM_SIZE_PRESETS.map((p, i) => {
          const active = acres === p.acres;
          return (
            <button
              key={p.id}
              onClick={() => pickSize(p)}
              aria-label={`${pick(p.label)}, suggests ${suggestLoads(p.acres, cropId)} loads`}
              style={{
                flex: 1, minHeight: 'var(--tap-min)', border: 'none', borderRadius: 'var(--radius)',
                background: active ? 'var(--green)' : 'var(--green-tint)',
                color: active ? '#fff' : 'var(--green-deep)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px',
              }}
            >
              {/* Farm size drawn as a literal count of field icons — bigger
                  farm, more fields — so the choice needs zero reading. */}
              <span style={{ fontSize: 18, letterSpacing: -1 }}>{'🌾'.repeat(i + 1)}</span>
              <span style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>{pick(p.label)}</span>
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

      {/* The suggestion is an estimate with a stated assumption, never a
          silent claim — and the stepper is the farmer's override. */}
      <p className="muted center" style={{ margin: 0, fontSize: 12 }}>{t('farmsize_estimate_hint')}</p>
    </div>
  );
}
