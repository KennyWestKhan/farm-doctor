import { useLang } from '../i18n.jsx';
import { getDisease } from '../data/diseaseDatabase';
import TreatmentCard from '../components/TreatmentCard.jsx';
import ValidationForm from '../components/ValidationForm.jsx';
import { CropArt } from '../components/CropArt.jsx';

export default function Result({ session, onRestart }) {
  const { t, pick } = useLang();
  const { result, region, report, cropId } = session;
  const top = result?.top;
  const disease = top ? getDisease(top.disease.id) : null;
  const confidencePct = top ? Math.round(top.confidence * 100) : 0;

  // No confident or partial match at all.
  if (!disease) {
    return (
      <div className="screen stack">
        <h2>{t('no_match_title')}</h2>
        <div className="card stack center">
          <div style={{ fontSize: 52 }}>🤔</div>
          <p>{t('no_match_body')}</p>
        </div>
        <button className="btn" onClick={onRestart}>↻ {t('start')}</button>
      </div>
    );
  }

  const uncertain = result.status === 'uncertain';
  const accent = uncertain ? 'var(--gold)' : 'var(--leaf)';

  return (
    <div className="screen stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2>{t('diagnosis')}</h2>
        <span className="pill pill--soil">{pick(disease.cropName)}</span>
      </div>

      {/* Hero diagnosis card with kente ribbon + crop art */}
      <div className="card card--ribbon stack">
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <div style={{ filter: 'drop-shadow(0 6px 10px rgba(58,42,23,0.2))', flexShrink: 0 }}>
            <CropArt cropId={cropId} size={72} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 23, fontFamily: 'var(--font-display)', lineHeight: 1.1, display: 'block' }}>
              {pick(disease.name)}
            </strong>
            <span className={`pill ${uncertain ? 'pill--warn' : 'pill--ok'}`} style={{ marginTop: 6 }}>
              {confidencePct}% {t('confidence')}
            </span>
          </div>
        </div>

        <div className="meter" aria-label={`${confidencePct}% confidence`}>
          <span style={{ '--to': `${confidencePct}%`, backgroundColor: accent }} />
        </div>

        <p className="muted" style={{ margin: 0 }}>{pick(disease.description)}</p>

        {result.regionalNote && (
          <div className="pill--warn" style={{ borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
            ⚠️ {pick(result.regionalNote)}
          </div>
        )}

        {uncertain && (
          <div className="pill--soil" style={{ borderRadius: 'var(--radius)', padding: 14 }}>
            <strong>{t('uncertain_title')}</strong>
            <p style={{ margin: '6px 0 0' }}>{t('uncertain_body')}</p>
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 10 }}>
        <div className="kente-rule" style={{ flex: 1 }} />
        <h3 style={{ whiteSpace: 'nowrap' }}>💊 {t('treatments')}</h3>
        <div className="kente-rule" style={{ flex: 1 }} />
      </div>

      {disease.treatments.map((tr) => (
        <TreatmentCard key={tr.id} treatment={tr} region={region} />
      ))}

      <ValidationForm
        reportId={report?.id}
        treatmentId={disease.treatments[0]?.id}
        region={region}
      />

      <button className="btn btn--ghost" onClick={onRestart}>↻ {t('start')}</button>
    </div>
  );
}
