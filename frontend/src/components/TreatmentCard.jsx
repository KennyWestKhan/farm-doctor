import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { getSuccessRate } from '../data/successRates';
import SupplierList from './SupplierList.jsx';

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
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <strong style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>{treatment.name}</strong>
        <span className="pill pill--soil">{t('price')}: {treatment.price_range}</span>
      </div>

      {rate && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="pill pill--ok" style={{ fontSize: 15 }}>
            {rate.percent}% {t('success_rate')}
          </span>
          <span className="muted" style={{ fontSize: 14 }}>
            {rate.total} {t('farmers_tried')}{!rate.exact ? ' (all regions)' : ''}
            {rate.trendDelta > 0 ? ` · ▲ +${rate.trendDelta}%` : ''}
          </span>
        </div>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 26 }}>{r.icon}</span>
            <div>
              <div className="muted" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {r.label}
              </div>
              <div style={{ fontSize: 17 }}>{r.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Video placeholder per treatment */}
      <div className="row" style={{ gap: 10, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 'var(--radius)' }}>
        <span style={{ fontSize: 24 }}>▶️</span>
        <span style={{ fontSize: 15 }}>{t('watch_video')} <span className="muted">(soon)</span></span>
      </div>

      <button className="btn btn--gold" onClick={() => setShowShops((v) => !v)}>
        🏪 {t('find_suppliers')}
      </button>

      {showShops && <SupplierList region={region} productName={treatment.name} />}
    </div>
  );
}
