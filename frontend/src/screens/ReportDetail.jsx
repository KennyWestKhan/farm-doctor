import { useLang } from '../i18n.jsx';
import { getDisease } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import { Header } from '../components/Chrome.jsx';

/**
 * Read-only view of a saved report. The diagnosis content (disease, treatments,
 * suppliers) is reconstructed from the bundled database using the stored
 * topDiseaseId + region, so it matches what was shown at the time. The regional
 * risk note is recomputed for the report's original date.
 */
export default function ReportDetail({ report, onBack }) {
  const { t } = useLang();
  const disease = report.topDiseaseId ? getDisease(report.topDiseaseId) : null;
  const confidencePct = Math.round((report.confidence || 0) * 100);
  const dateLabel = new Date(report.createdAt).toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  if (!disease) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={onBack} />
        <div className="card center stack" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <h3>{t('no_match_title')}</h3>
          <p className="muted">{t('no_match_body')}</p>
        </div>
      </div>
    );
  }

  // Recompute the risk note as it would have read on the original diagnosis date.
  const regionalNote =
    report.status === 'confident'
      ? buildRegionalNote(disease, report.region, new Date(report.createdAt))
      : null;

  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={onBack} />
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
      </div>
    </div>
  );
}
