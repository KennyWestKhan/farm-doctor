import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { LangToggle, NetDot } from '../components/Chrome.jsx';
import { useAuth } from '../auth/useAuth.js';
import { getRecentReports } from '../db/storage';
import { getCrop, getDisease, REGIONS, ALL_DISEASES } from '../data/diseaseDatabase';
import CropPhoto from '../components/CropPhoto.jsx';
import RegionSheet from '../components/RegionSheet.jsx';
import { sanitizeText, LIMITS } from '../utils/sanitize';
import { searchKnowledge } from '../utils/search';
import { getSavedRegion } from '../utils/prefs';
import { tipOfTheDay } from '../data/tips';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 17) return 'greeting_afternoon';
  return 'greeting_evening';
}

// Diseases currently active in the farmer's region, peaking-now ones first,
// then high prevalence before medium. Fully offline — just filters the bundled DB.
function getActiveAlerts(region) {
  if (!region) return [];
  const month = new Date().getMonth() + 1;
  return ALL_DISEASES
    .filter((d) => d.seasonal_months.includes(month) && ['high', 'medium'].includes(d.regional_prevalence[region]))
    .sort((a, b) => {
      const peakA = a.peak_month === month ? 1 : 0;
      const peakB = b.peak_month === month ? 1 : 0;
      if (peakA !== peakB) return peakB - peakA;
      const rankA = a.regional_prevalence[region] === 'high' ? 1 : 0;
      const rankB = b.regional_prevalence[region] === 'high' ? 1 : 0;
      return rankB - rankA;
    })
    .slice(0, 4);
}

export default function Home() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [region, setRegion] = useState(getSavedRegion());
  const [showRegion, setShowRegion] = useState(false);

  useEffect(() => { getRecentReports(3).then(setRecent); }, []);

  const alerts = getActiveAlerts(region);

  // Sanitize on every keystroke, then run the local (offline) search. Input
  // never reaches the LLM here — this is a lexical search over bundled data.
  const onSearch = (raw) => {
    const clean = sanitizeText(raw, LIMITS.query);
    setQuery(clean);
    setResults(clean.length >= 2 ? searchKnowledge(clean) : []);
  };

  // Selecting a result jumps into the diagnose flow with the crop preselected.
  const openResult = (r) => {
    nav('/diagnose', { state: { cropId: r.cropId, diseaseId: r.diseaseId || null } });
  };

  return (
    <div className="screen screen--flush page-enter">
      {/* Gradient greeting header */}
      <div className="gradhead">
        <div className="between">
          <div>
            <div style={{ opacity: 0.85, fontSize: 14 }}>{t(greetingKey())} 👋</div>
            <h1 style={{ marginTop: 2 }}>{t('app_name')}</h1>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <LangToggle onGradient />
            <button
              className="icon-btn icon-btn--on-grad"
              onClick={() => nav('/profile')}
              aria-label="Profile"
              style={{ width: 38, height: 38, fontSize: 16 }}
            >
              {user ? '👤' : '👋'}
            </button>
          </div>
        </div>

        {/* Location chip — set once, change anytime */}
        <button
          className="pill pill--ghost"
          onClick={() => setShowRegion(true)}
          style={{ border: 'none', marginTop: 12 }}
        >
          📍 {region ? pick(REGIONS[region]) : t('set_location')} ▾
        </button>

        <label className="search" style={{ marginTop: 16 }}>
          🔍
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={LIMITS.query}
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('home_prompt')}
            aria-label={t('home_prompt')}
          />
          {query && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Clear"
              style={{ border: 'none', background: 'none', color: 'var(--ink-soft)', fontSize: 18 }}
            >
              ✕
            </button>
          )}
        </label>

        {/* Live search results */}
        {results.length > 0 && (
          <div className="card" style={{ marginTop: 10, padding: 8 }}>
            {results.map((r) => (
              <button
                key={`${r.type}-${r.diseaseId || r.cropId}`}
                onClick={() => openResult(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', padding: '12px 10px', textAlign: 'left', borderRadius: 'var(--radius-sm)' }}
              >
                <span style={{ fontSize: 22 }}>{r.type === 'crop' ? '🌱' : '🦠'}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, display: 'block', color: 'var(--ink)' }}>{pick(r.label)}</strong>
                  {r.type === 'disease' && <span className="muted" style={{ fontSize: 13 }}>{pick(r.cropName)}</span>}
                </span>
                <span style={{ color: 'var(--green)' }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="stagger" style={{ padding: '18px 18px 0' }}>
        {/* Primary CTA */}
        <button className="card" onClick={() => nav('/diagnose')} style={{ background: 'var(--green-tint)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 38 }}>🔍</span>
          <span style={{ flex: 1 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--green-deep)', display: 'block' }}>
              {t('home_diagnose_cta')}
            </strong>
            <span className="muted" style={{ fontSize: 14 }}>{t('home_prompt')}</span>
          </span>
          <span style={{ fontSize: 22, color: 'var(--green)' }}>→</span>
        </button>

        {/* Scan actions — one tap to camera */}
        <button className="card" onClick={() => nav('/scan/crop')} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 34 }}>🌿</span>
          <span style={{ flex: 1 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18, display: 'block' }}>{t('scan_crop_title')}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{t('scan_crop_desc_short')}</span>
          </span>
          <span style={{ fontSize: 22, color: 'var(--green)' }}>→</span>
        </button>
        <button className="card" onClick={() => nav('/scan/label')} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 34 }}>🏷️</span>
          <span style={{ flex: 1 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18, display: 'block' }}>{t('scan_label_title')}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{t('scan_label_desc_short')}</span>
          </span>
          <span style={{ fontSize: 22, color: 'var(--green)' }}>→</span>
        </button>

        {/* Quick actions */}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="card" onClick={() => nav('/shops')} style={{ flex: 1 }}>
            <div style={{ fontSize: 28 }}>🏪</div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{t('home_browse_shops')}</strong>
          </button>
          <button className="card" onClick={() => nav('/reports')} style={{ flex: 1 }}>
            <div style={{ fontSize: 28 }}>📋</div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{t('tab_reports')}</strong>
          </button>
        </div>

        {/* Regional pest & disease alerts */}
        {alerts.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h3 style={{ marginBottom: 10 }}>⚠️ {t('alerts_title')}</h3>
            <div className="stack">
              {alerts.map((d) => {
                const crop = getCrop(d.cropId);
                const peaking = d.peak_month === new Date().getMonth() + 1;
                return (
                  <button
                    key={d.id}
                    className="card row"
                    onClick={() => nav('/diagnose', { state: { cropId: d.cropId } })}
                    style={{ padding: 12, gap: 12, textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 28 }}>{crop?.emoji}</span>
                    <span style={{ flex: 1 }}>
                      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15, display: 'block' }}>
                        {pick(d.name)}
                      </strong>
                      <span className="muted" style={{ fontSize: 13 }}>{pick(d.description)}</span>
                    </span>
                    <span className={peaking ? 'pill pill--bad' : 'pill pill--warn'}>
                      {peaking ? t('alerts_peaking') : t('alerts_active')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent checks */}
        <div className="between" style={{ marginTop: 22, marginBottom: 10 }}>
          <h3>{t('home_recent')}</h3>
          {recent.length > 0 && (
            <button className="pill pill--green" style={{ border: 'none' }} onClick={() => nav('/reports')}>
              {t('view_all')}
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="card center muted">{t('home_no_recent')}</div>
        ) : (
          <div className="stack">
            {recent.map((r) => {
              const crop = getCrop(r.cropId);
              const disease = r.topDiseaseId ? getDisease(r.topDiseaseId) : null;
              return (
                <button
                  key={r.id}
                  className="card row"
                  onClick={() => nav(`/reports/${r.id}`)}
                  style={{ padding: 12, gap: 12, textAlign: 'left' }}
                >
                  <div style={{ width: 54, flexShrink: 0 }}>
                    <CropPhoto cropId={r.cropId} height={54} radius="var(--radius-sm)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>
                      {disease ? pick(disease.name) : pick(crop?.name)}
                    </strong>
                    <div className="muted" style={{ fontSize: 13 }}>{pick(crop?.name)}</div>
                  </div>
                  <span className="pill pill--green">{Math.round((r.confidence || 0) * 100)}%</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tip card */}
        <div className="card" style={{ marginTop: 22, background: 'var(--green-tint)' }}>
          <div className="row" style={{ gap: 10 }}>
            <span style={{ fontSize: 26 }}>💡</span>
            <div>
              <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--green-deep)' }}>{t('home_tip_title')}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{pick(tipOfTheDay())}</p>
            </div>
          </div>
        </div>

        <div className="center" style={{ marginTop: 18 }}><NetDot /></div>
      </div>

      {showRegion && (
        <RegionSheet current={region} onPick={setRegion} onClose={() => setShowRegion(false)} />
      )}
    </div>
  );
}
