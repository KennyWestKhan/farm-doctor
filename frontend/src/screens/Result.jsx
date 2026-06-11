import { useLang } from '../i18n.jsx';
import { getDisease } from '../data/diseaseDatabase';
import TreatmentCard from '../components/TreatmentCard.jsx';
import ValidationForm from '../components/ValidationForm.jsx';
import CropPhoto from '../components/CropPhoto.jsx';
import { Header } from '../components/Chrome.jsx';

export default function Result({ session, onRestart, onHome }) {
  const { t, pick } = useLang();
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

  const uncertain = result.status === 'uncertain';

  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={onHome} />

      <div className="stagger">
        {/* Photo hero with diagnosis overlay */}
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <CropPhoto cropId={cropId} diseaseId={disease.id} height={190} rounded={false} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15,40,28,0.85) 8%, transparent 60%)',
            display: 'flex', alignItems: 'flex-end', padding: 16,
          }}>
            <div>
              <span className={`pill ${uncertain ? 'pill--warn' : 'pill--green'}`} style={{ background: uncertain ? 'var(--warn)' : 'var(--green)', color: '#fff' }}>
                {confidencePct}% {t('confidence')}
              </span>
              <h2 style={{ color: '#fff', marginTop: 8 }}>{pick(disease.name)}</h2>
            </div>
          </div>
        </div>

        {/* Detail card */}
        <div className="card stack" style={{ marginTop: 14 }}>
          <div className="meter"><span style={{ '--to': `${confidencePct}%`, background: uncertain ? 'var(--warn)' : 'var(--green)' }} /></div>
          <p style={{ margin: 0 }}>{pick(disease.description)}</p>

          {result.regionalNote && (
            <div className="card--tint" style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
              ⚠️ {pick(result.regionalNote)}
            </div>
          )}
          {uncertain && (
            <div className="card--tint" style={{ borderRadius: 'var(--radius)', padding: 14 }}>
              <strong style={{ color: 'var(--green-deep)' }}>{t('uncertain_title')}</strong>
              <p style={{ margin: '6px 0 0' }} className="muted">{t('uncertain_body')}</p>
            </div>
          )}
        </div>

        <h3 style={{ margin: '22px 4px 10px' }}>💊 {t('treatments')}</h3>
        {disease.treatments.map((tr) => (
          <div key={tr.id} style={{ marginBottom: 14 }}>
            <TreatmentCard treatment={tr} region={region} />
          </div>
        ))}

        <ValidationForm reportId={report?.id} treatmentId={disease.treatments[0]?.id} region={region} />

        <button className="btn btn--tint btn--block" onClick={onRestart} style={{ marginTop: 16 }}>↻ {t('start')}</button>
      </div>
    </div>
  );
}
