import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { getSuccessRate } from '../data/successRates';
import SupplierSheet from './SupplierSheet.jsx';

export default function TreatmentCard({ treatment, region }) {
  const { t, lang } = useLang();
  const [showShops, setShowShops] = useState(false);
  const instr = treatment.farmer_instruction[lang] || treatment.farmer_instruction.en;
  const rate = getSuccessRate(treatment.id, region);

  const rows = [
    { icon: '🥣', label: t('how_to_mix'), text: instr.mixing },
    { icon: '🍶', label: t('how_much'), text: instr.amount },
    { icon: '💨', label: t('how_to_apply'), text: instr.application },
    { icon: '🔁', label: t('how_often'), text: instr.frequency },
  ];

  return (
    <div className="card stack">
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <strong style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{treatment.name}</strong>
        <span className="pill pill--green">{treatment.price_range}</span>
      </div>

      {rate && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="pill pill--green" style={{ fontSize: 14 }}>✅ {rate.percent}% {t('success_rate')}</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {rate.total} {t('farmers_tried')}{!rate.exact ? ' (all regions)' : ''}{rate.trendDelta > 0 ? ` · ▲ +${rate.trendDelta}%` : ''}
          </span>
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

      <button className="btn btn--block" onClick={() => setShowShops(true)}>🏪 {t('find_suppliers')}</button>

      {showShops && (
        <SupplierSheet region={region} productName={treatment.name} onClose={() => setShowShops(false)} />
      )}
    </div>
  );
}
