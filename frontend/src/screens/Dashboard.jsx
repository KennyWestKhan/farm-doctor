import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardStats } from '../data/successRates';
import { REGIONS } from '../data/diseaseDatabase';

function useCountUp(target, ms = 900) {
  const [n, setN] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const num = Number(String(target).replace(/[^0-9.]/g, '')) || 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      setN(Math.round(num * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return String(target).includes('%') ? `${n}%` : n;
}

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 0 48px' }}>
        <div className="gradhead" style={{ borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
          <div className="between">
            <div>
              <h1>📊 Impact Dashboard</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
                Farm Doctor Ghana · Ghana AI Innovation Challenge 2026
              </p>
            </div>
            <button className="pill pill--ghost" style={{ border: 'none' }} onClick={() => navigate('/')}>← App</button>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>Demo data for judges.</p>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Kpi big={stats.farmersTested} label="Farmers tested" />
            <Kpi big={stats.diagnoses} label="Diagnoses made" />
            <Kpi big={`${stats.avgSuccess}%`} label="Avg success rate" />
            <Kpi big={stats.validations} label="Validations" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginTop: 22 }}>
            <section>
              <h3 style={{ marginBottom: 12 }}>Top diseases</h3>
              <div className="stack">
                {TOP_DISEASES.map((d) => <Bar key={d.id} label={d.label} count={d.count} success={d.success} max={50} />)}
              </div>
            </section>
            <section>
              <h3 style={{ marginBottom: 12 }}>By region</h3>
              <div className="stack">
                {BY_REGION.map((r) => <Bar key={r.id} label={REGIONS[r.id]?.en || r.id} count={r.count} success={r.success} max={90} />)}
              </div>
            </section>
          </div>

          <div className="card" style={{ background: 'var(--grad-green)', color: '#fff', marginTop: 22 }}>
            <h3 style={{ color: '#fff' }}>Estimated impact</h3>
            <p style={{ margin: '8px 0 0', fontSize: 17, color: 'rgba(255,255,255,0.92)' }}>
              {stats.farmersTested} farmers × ~50% crop loss prevented ≈{' '}
              <strong style={{ color: '#fff' }}>GHc {valueSaved}</strong> of crops saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ big, label }) {
  const value = useCountUp(big);
  return (
    <div className="card center" style={{ padding: 18 }}>
      <div className="pop" style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green)' }}>{value}</div>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
    </div>
  );
}

function Bar({ label, count, success, max }) {
  const pct = Math.min(100, (count / max) * 100);
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="between" style={{ marginBottom: 8 }}>
        <strong style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>{label}</strong>
        <span className="pill pill--green">{success}%</span>
      </div>
      <div className="meter"><span style={{ '--to': `${pct}%` }} /></div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{count} diagnoses</div>
    </div>
  );
}
