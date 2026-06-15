import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { getDisease } from '../data/diseaseDatabase';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import ValidationForm from '../components/ValidationForm.jsx';
import { Header } from '../components/Chrome.jsx';

export default function Result({ session, onRestart, onHome }) {
  const { t } = useLang();
  const nav = useNavigate();
  const { result, region, report, cropId } = session;
  const top = result?.top;
  const disease = top ? getDisease(top.disease.id) : null;
  const confidencePct = top ? Math.round(top.confidence * 100) : 0;

  if (!disease) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={onHome} />
        <div className="card center stack" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <h3>{t('no_match_title')}</h3>
          <p className="muted">{t('no_match_body')}</p>
        </div>
        <button className="btn btn--block" onClick={onRestart} style={{ marginTop: 16 }}>↻ {t('start')}</button>
      </div>
    );
  }

  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={onHome} />
      <div className="stagger">
        <DiagnosisDetail
          cropId={cropId}
          disease={disease}
          confidencePct={confidencePct}
          uncertain={result.status === 'uncertain'}
          regionalNote={result.regionalNote}
          region={region}
        />
        {/* Bought the chemical? Scan its label for plain-language directions. */}
        <button className="card" onClick={() => nav('/scan/label')} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 30 }}>🧴</span>
          <strong style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 16 }}>{t('scan_from_result')}</strong>
          <span style={{ fontSize: 20, color: 'var(--green)' }}>→</span>
        </button>

        <ValidationForm reportId={report?.id} treatmentId={disease.treatments[0]?.id} region={region} />
        <button className="btn btn--tint btn--block" onClick={onRestart} style={{ marginTop: 16 }}>↻ {t('start')}</button>
      </div>
    </div>
  );
}
