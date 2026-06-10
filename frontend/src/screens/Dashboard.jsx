import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardStats } from '../data/successRates';
import { REGIONS } from '../data/diseaseDatabase';

// Animate a number from 0 → target on mount, so the KPIs "count up" for judges.
function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const num = Number(String(target).replace(/[^0-9.]/g, '')) || 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(num * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  // Preserve a trailing % if the target had one.
  return String(target).includes('%') ? `${n}%` : n;
}

// Seeded per-disease and per-region figures for the judges' impact view.
const TOP_DISEASES = [
  { id: 'chilli_anthracnose', label: 'Anthracnose (Chilli)', count: 47, success: 82 },
  { id: 'cassava_brown_streak', label: 'Cassava Brown Streak', count: 38, success: 91 },
  { id: 'sweetpotato_weevil', label: 'Sweet Potato Weevil', count: 32, success: 79 },
  { id: 'groundnut_leafspot', label: 'Groundnut Leaf Spot', count: 29, success: 83 },
];

const BY_REGION = [
  { id: 'ashanti', count: 89, success: 85 },
  { id: 'greater_accra', count: 67, success: 81 },
  { id: 'western', count: 45, success: 87 },
  { id: 'volta', count: 52, success: 80 },
  { id: 'northern', count: 31, success: 84 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = dashboardStats();
  const valueSaved = (stats.farmersTested * 0.5 * 5000).toLocaleString();

  return (
    <div className="app-shell">
      <div className="screen stack">
        <button className="btn btn--ghost" onClick={() => navigate('/')} style={{ marginBottom: 8 }}>
          ← Home
        </button>
        <h2>📊 Impact Dashboard</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
          Demo data for the Ghana AI Innovation Challenge.
        </p>

        {/* Headline KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Kpi big={stats.farmersTested} label="Farmers tested" tone="leaf" />
          <Kpi big={stats.diagnoses} label="Diagnoses made" tone="gold" />
          <Kpi big={`${stats.avgSuccess}%`} label="Avg success rate" tone="leaf" />
          <Kpi big={stats.validations} label="Validations" tone="clay" />
        </div>

        <h3 style={{ marginTop: 12 }}>Top diseases</h3>
        <div className="stack">
          {TOP_DISEASES.map((d) => (
            <Bar key={d.id} label={d.label} count={d.count} success={d.success} max={50} />
          ))}
        </div>

        <h3 style={{ marginTop: 12 }}>By region</h3>
        <div className="stack">
          {BY_REGION.map((r) => (
            <Bar
              key={r.id}
              label={REGIONS[r.id]?.en || r.id}
              count={r.count}
              success={r.success}
              max={90}
            />
          ))}
        </div>

        <div className="card" style={{ background: 'var(--soil)', color: '#fff' }}>
          <h3 style={{ color: '#fff' }}>Estimated impact</h3>
          <p style={{ margin: '8px 0 0', fontSize: 17 }}>
            {stats.farmersTested} farmers × ~50% crop loss prevented ≈{' '}
            <strong style={{ color: 'var(--gold)' }}>GHc {valueSaved}</strong> of crops saved.
          </p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ big, label, tone }) {
  const colors = { leaf: 'var(--leaf)', gold: 'var(--gold-deep)', clay: 'var(--clay)' };
  const value = useCountUp(big);
  return (
    <div className="card center" style={{ padding: 16 }}>
      <div className="pop" style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: colors[tone] }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

function Bar({ label, count, success, max }) {
  const pct = Math.min(100, (count / max) * 100);
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>{label}</strong>
        <span className="pill pill--ok">{success}%</span>
      </div>
      <div className="meter">
        <span style={{ '--to': `${pct}%`, backgroundColor: 'var(--leaf)' }} />
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{count} diagnoses</div>
    </div>
  );
}
