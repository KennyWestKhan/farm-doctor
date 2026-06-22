import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardStats } from '../data/successRates';
import { getReports } from '../db/storage';
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

const DEMO_TOP_DISEASES = [
  { id: 'chilli_anthracnose', label: 'Anthracnose (Chilli)', count: 47, success: 82 },
  { id: 'cassava_brown_streak', label: 'Cassava Brown Streak', count: 38, success: 91 },
  { id: 'sweetpotato_weevil', label: 'Sweet Potato Weevil', count: 32, success: 79 },
  { id: 'groundnut_leafspot', label: 'Groundnut Leaf Spot', count: 29, success: 83 },
];

const DEMO_BY_REGION = [
  { id: 'ashanti', count: 89, success: 85 },
  { id: 'greater_accra', count: 67, success: 81 },
  { id: 'western', count: 45, success: 87 },
  { id: 'volta', count: 52, success: 80 },
  { id: 'northern', count: 31, success: 84 },
];

async function computeLiveStats() {
  const reports = await getReports();
  const diagnoses = reports.length;

  const regionCounts = {};
  const diseaseCounts = {};
  for (const r of reports) {
    if (r.region) regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
    if (r.topDiseaseId) diseaseCounts[r.topDiseaseId] = (diseaseCounts[r.topDiseaseId] || 0) + 1;
  }

  const byRegion = Object.entries(regionCounts)
    .map(([id, count]) => ({ id, count, success: 0 }))
    .sort((a, b) => b.count - a.count);

  const topDiseases = Object.entries(diseaseCounts)
    .map(([id, count]) => ({ id, label: id.replace(/_/g, ' '), count, success: 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return { diagnoses, validations: 0, avgSuccess: 0, farmersTested: 0, byRegion, topDiseases };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [demo, setDemo] = useState(false);
  const [live, setLive] = useState(null);

  useEffect(() => { computeLiveStats().then(setLive); }, []);

  const demoStats = dashboardStats();
  const stats = demo ? demoStats : (live || { diagnoses: 0, validations: 0, avgSuccess: 0, farmersTested: 0 });
  const topDiseases = demo ? DEMO_TOP_DISEASES : (live?.topDiseases || []);
  const byRegion = demo ? DEMO_BY_REGION : (live?.byRegion || []);
  const valueSaved = demo ? (demoStats.farmersTested * 0.5 * 5000).toLocaleString() : '0';
  const hasLiveData = live && live.diagnoses > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 0 48px' }}>
        <div className="gradhead" style={{ borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
          <div className="between">
            <div>
              <h1>Impact Dashboard</h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>
                Farm Doctor Ghana
              </p>
            </div>
            <button className="pill pill--ghost" style={{ border: 'none' }} onClick={() => navigate('/')}>← App</button>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {/* Demo toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 'var(--radius)',
            background: demo ? 'var(--warn-tint)' : 'var(--card)',
            border: demo ? '1.5px solid rgba(217,138,31,0.25)' : '1.5px solid var(--line)',
            marginBottom: 16,
          }}>
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: demo ? 'var(--warn)' : 'var(--ink)' }}>
                {demo ? 'Showing demo data' : 'Showing live data'}
              </strong>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {demo
                  ? 'Illustrative numbers showing what the dashboard looks like at scale'
                  : hasLiveData
                    ? `${live.diagnoses} real diagnoses from the app`
                    : 'No farmer data collected yet. Toggle to see a demo preview.'}
              </div>
            </div>
            <button
              onClick={() => setDemo(!demo)}
              style={{
                padding: '8px 16px', borderRadius: 999, border: 'none', flexShrink: 0,
                background: demo ? 'var(--warn)' : 'var(--green)',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 13, color: '#fff',
              }}
            >
              {demo ? 'Show live' : 'Show demo'}
            </button>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            <Kpi big={stats.diagnoses} label="Diagnoses made" />
            <Kpi big={stats.validations} label="Validations" />
            <Kpi big={stats.avgSuccess ? `${stats.avgSuccess}%` : '—'} label="Avg success rate" />
            <Kpi big={stats.farmersTested} label="Farmers" />
          </div>

          {(topDiseases.length > 0 || byRegion.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginTop: 22 }}>
              {topDiseases.length > 0 && (
                <section>
                  <h3 style={{ marginBottom: 12 }}>Top diseases</h3>
                  <div className="stack">
                    {topDiseases.map((d) => (
                      <Bar key={d.id} label={d.label} count={d.count} success={d.success} max={Math.max(...topDiseases.map(x => x.count), 1)} />
                    ))}
                  </div>
                </section>
              )}
              {byRegion.length > 0 && (
                <section>
                  <h3 style={{ marginBottom: 12 }}>By region</h3>
                  <div className="stack">
                    {byRegion.map((r) => (
                      <Bar key={r.id} label={REGIONS[r.id]?.en || r.id} count={r.count} success={r.success} max={Math.max(...byRegion.map(x => x.count), 1)} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {!demo && !hasLiveData && (
            <div className="card center" style={{ marginTop: 22, padding: 28 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>📊</div>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                The dashboard populates as farmers use the app and submit treatment feedback. Toggle "Show demo" above to preview the dashboard at scale.
              </p>
            </div>
          )}

          {demo && (
            <div className="card" style={{ background: 'var(--grad-green)', color: '#fff', marginTop: 22 }}>
              <h3 style={{ color: '#fff' }}>Estimated impact (demo)</h3>
              <p style={{ margin: '8px 0 0', fontSize: 17, color: 'rgba(255,255,255,0.92)' }}>
                {demoStats.farmersTested} farmers × ~50% crop loss prevented ≈{' '}
                <strong style={{ color: '#fff' }}>GHc {valueSaved}</strong> of crops saved.
              </p>
            </div>
          )}
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
        {success > 0 && <span className="pill pill--green">{success}%</span>}
      </div>
      <div className="meter"><span style={{ '--to': `${pct}%` }} /></div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{count} diagnoses</div>
    </div>
  );
}
