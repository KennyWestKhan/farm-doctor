import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { getDisease } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import { getReport, getValidationsForReport } from '../db/storage';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import { Header } from '../components/Chrome.jsx';

/**
 * Read-only view of a saved report at /reports/:id.
 *
 * Being a real route (not local state) means Android's hardware back and the
 * in-app back both pop correctly to the Reports list. The diagnosis content is
 * reconstructed from the bundled database via the stored topDiseaseId + region;
 * the regional risk note is recomputed for the report's original date. Any
 * "did it work?" feedback the farmer gave is shown beneath it.
 */
const OUTCOME = {
  worked: { key: 'worked', cls: 'pill--green', icon: '✅' },
  partial: { key: 'partly', cls: 'pill--warn', icon: '➗' },
  failed: { key: 'failed', cls: 'pill--bad', icon: '❌' },
};

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, pick } = useLang();
  const [state, setState] = useState({ loading: true, report: null, validations: [] });

  useEffect(() => {
    let alive = true;
    Promise.all([getReport(id), getValidationsForReport(id)]).then(([report, validations]) => {
      if (alive) setState({ loading: false, report, validations });
    });
    return () => { alive = false; };
  }, [id]);

  const back = () => navigate('/reports');
  const { loading, report, validations } = state;

  if (loading) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={back} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={back} />
        <div className="card center stack" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52 }}>🔍</div>
          <p className="muted">{t('not_found')}</p>
        </div>
      </div>
    );
  }

  const disease = report.topDiseaseId ? getDisease(report.topDiseaseId) : null;
  const confidencePct = Math.round((report.confidence || 0) * 100);
  const dateLabel = new Date(report.createdAt).toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  if (!disease) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={back} />
        <div className="card center stack" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <h3>{t('no_match_title')}</h3>
          <p className="muted">{t('no_match_body')}</p>
        </div>
      </div>
    );
  }

  const regionalNote =
    report.status === 'confident'
      ? buildRegionalNote(disease, report.region, new Date(report.createdAt))
      : null;

  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={back} />
      <div className="stagger">
        <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
          {t('diagnosed_on')} {dateLabel}
        </div>

        <DiagnosisDetail
          cropId={report.cropId}
          disease={disease}
          confidencePct={confidencePct}
          uncertain={report.status === 'uncertain'}
          regionalNote={regionalNote}
          region={report.region}
        />

        {/* The farmer's own "did it work?" feedback, if they gave any */}
        {validations.length > 0 && (
          <>
            <h3 style={{ margin: '22px 4px 10px' }}>🗣️ {t('your_feedback')}</h3>
            {validations.map((v) => {
              const o = OUTCOME[v.outcome];
              return (
                <div key={v.id} className="card stack" style={{ marginBottom: 12 }}>
                  <strong style={{ fontFamily: 'var(--font-display)' }}>
                    {v.used ? t('you_used_it') : t('you_didnt_use')}
                  </strong>
                  {v.used && o && (
                    <div className="row">
                      <span className="muted" style={{ fontSize: 13 }}>{t('result_label')}:</span>
                      <span className={`pill ${o.cls}`}>{o.icon} {t(o.key)}</span>
                    </div>
                  )}
                  {v.notes && <p className="muted" style={{ margin: 0 }}>“{v.notes}”</p>}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
