import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { getReports } from '../db/storage';
import { getCrop, getDisease, REGIONS } from '../data/diseaseDatabase';
import CropPhoto from '../components/CropPhoto.jsx';
import ReportDetail from './ReportDetail.jsx';

export default function Reports() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const openReportId = useLocation().state?.openReportId || null;
  const [reports, setReports] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getReports().then((all) => {
      setReports(all);
      // Deep-link from Home's "recent checks" into a specific report.
      if (openReportId) {
        const match = all.find((r) => r.id === openReportId);
        if (match) setSelected(match);
      }
    });
  }, [openReportId]);

  // Tapping a report opens its full reconstructed diagnosis.
  if (selected) return <ReportDetail report={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="screen screen--flush page-enter">
      <div className="gradhead">
        <h1>{t('reports_title')}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0' }}>{t('reports_subtitle')}</p>
      </div>

      <div style={{ padding: '16px 18px 0' }}>
        {reports && reports.length === 0 && (
          <div className="card center stack" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 44 }}>🌱</div>
            <p className="muted">{t('reports_empty')}</p>
            <button className="btn btn--block" onClick={() => nav('/diagnose')}>🔍 {t('home_diagnose_cta')}</button>
          </div>
        )}

        <div className="stagger stack">
          {(reports || []).map((r) => {
            const crop = getCrop(r.cropId);
            const disease = r.topDiseaseId ? getDisease(r.topDiseaseId) : null;
            const date = new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
            return (
              <button key={r.id} className="card row" onClick={() => setSelected(r)} style={{ gap: 12, padding: 12, textAlign: 'left' }}>
                <div style={{ width: 60, flexShrink: 0 }}>
                  <CropPhoto cropId={r.cropId} diseaseId={r.topDiseaseId} height={60} radius="var(--radius-sm)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
                    {disease ? pick(disease.name) : pick(crop?.name)}
                  </strong>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {pick(crop?.name)} · {pick(REGIONS[r.region]) || ''} · {date}
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {r.offline && <span className="pill pill--green" style={{ fontSize: 11 }}>📴 {t('reports_offline_tag')}</span>}
                    {r.status === 'uncertain' && <span className="pill pill--warn" style={{ fontSize: 11 }}>🤖 {t('reports_pending_vision')}</span>}
                  </div>
                </div>
                <span className="row" style={{ gap: 6 }}>
                  <span className="pill pill--green">{Math.round((r.confidence || 0) * 100)}%</span>
                  <span style={{ color: 'var(--green)' }}>→</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
