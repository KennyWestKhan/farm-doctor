import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import useSuccessRates from './useSuccessRates';
import SupplierSheet from './SupplierSheet.jsx';
import { totalSprayNote, isSprayBased, detectVessel, purchaseNote } from '../data/farmSize.js';
import { TREATMENT_CATEGORY } from '../data/vendorCategories';

export default function TreatmentCard({ treatment, region, loads }) {
  const { t, pick, lang } = useLang();
  const [showShops, setShowShops] = useState(false);
  const instr = treatment.farmer_instruction[lang] || treatment.farmer_instruction.en;
  const { loading, getRate } = useSuccessRates();
  const rate = loading ? undefined : getRate(treatment.id, region);

  const rows = [
    { icon: '🥣', label: t('how_to_mix'), text: instr.mixing },
    { icon: '🍶', label: t('how_much'), text: instr.amount },
    { icon: '💨', label: t('how_to_apply'), text: instr.application },
    { icon: '🔁', label: t('how_often'), text: instr.frequency },
  ];

  // Cultural-control treatments (crop rotation, removing infected plants,
  // mulching, relying on natural predators, etc.) aren't mixed in any vessel,
  // so a quantity total would be meaningless. Checked against the always-
  // English mixing text rather than the active-language one, so the check is
  // stable regardless of UI language.
  const showTotal = loads && isSprayBased(treatment);
  const vessel = showTotal ? detectVessel(treatment) : null;
  // "How much to buy" only shows when the dose text parsed cleanly — a wrong
  // purchase number is worse than none.
  const buy = showTotal ? purchaseNote(loads, treatment) : null;

  return (
    <div className="card stack">
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <strong style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{treatment.name}</strong>
        <span className="pill pill--green">{treatment.price_range}</span>
      </div>

      {/* rate === undefined means still loading; null means no data; object = real data */}
      {rate === undefined ? null : rate ? (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="pill pill--green" style={{ fontSize: 14 }}>✅ {rate.percent}% {t('success_rate')}</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {rate.total} {t('farmers_tried')}{!rate.exact ? ' (all regions)' : ''}{rate.trendDelta > 0 ? ` · ▲ +${rate.trendDelta}%` : ''}
          </span>
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
          {t('no_farmer_reports')}
        </div>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24 }}>{r.icon}</span>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{r.label}</div>
              <div style={{ fontSize: 16 }}>{r.text}</div>
            </div>
          </div>
        ))}
      </div>

      {showTotal && (
        <div className="row" style={{ gap: 12, alignItems: 'flex-start', background: 'var(--green-tint)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
          <span style={{ fontSize: 24 }}>🪣</span>
          <div>
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: 'var(--green-deep)' }}>
              {t('farmsize_total_label')}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-deep)' }}>{pick(totalSprayNote(loads, vessel))}</div>
            {buy && (
              <div style={{ fontSize: 14, marginTop: 4, color: 'var(--green-deep)' }}>🛒 {pick(buy)}</div>
            )}
          </div>
        </div>
      )}

      <button className="btn btn--block" onClick={() => setShowShops(true)}>🏪 {t('find_suppliers')}</button>

      {showShops && (
        <SupplierSheet region={region} productName={treatment.name} category={TREATMENT_CATEGORY} onClose={() => setShowShops(false)} />
      )}
    </div>
  );
}
