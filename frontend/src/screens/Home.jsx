import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { LangToggle, NetDot } from '../components/Chrome.jsx';
import { getReports } from '../db/storage';
import { getCrop, getDisease } from '../data/diseaseDatabase';
import CropPhoto from '../components/CropPhoto.jsx';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 17) return 'greeting_afternoon';
  return 'greeting_evening';
}

export default function Home() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const [recent, setRecent] = useState([]);

  useEffect(() => { getReports().then((r) => setRecent(r.slice(0, 3))); }, []);

  return (
    <div className="screen screen--flush page-enter">
      {/* Gradient greeting header */}
      <div className="gradhead">
        <div className="between">
          <div>
            <div style={{ opacity: 0.85, fontSize: 14 }}>{t(greetingKey())} 👋</div>
            <h1 style={{ marginTop: 2 }}>{t('app_name')}</h1>
          </div>
          <LangToggle onGradient />
        </div>
        <div className="search" style={{ marginTop: 16 }}>
          🔍 <span style={{ flex: 1 }}>{t('home_prompt')}</span>
        </div>
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
                <div key={r.id} className="card row" style={{ padding: 12, gap: 12 }}>
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
                </div>
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
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{t('home_tip_body')}</p>
            </div>
          </div>
        </div>

        <div className="center" style={{ marginTop: 18 }}><NetDot /></div>
      </div>
    </div>
  );
}
