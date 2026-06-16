import { useLang } from '../i18n.jsx';
import CropPhoto from './CropPhoto.jsx';
import TreatmentCard from './TreatmentCard.jsx';
import DiseaseVideos from './DiseaseVideos.jsx';

/**
 * Presentational view of a single diagnosis: photo hero with the disease +
 * confidence, description, optional regional-risk note, and treatment cards
 * (each with its supplier sheet). Shared by the live Result screen and the
 * saved-report detail so they look identical.
 *
 * Props:
 *  - cropId, disease (full disease object), confidencePct, uncertain,
 *    regionalNote ({en,twi}|null), region
 */
export default function DiagnosisDetail({ cropId, disease, confidencePct, uncertain, regionalNote, region, uncertainNote }) {
  const { t, pick } = useLang();
  // The "not fully sure" copy depends on the source: an offline guess promises an
  // AI recheck when online; an AI result (scan / rechecked) does not.
  const note = uncertainNote ?? t('uncertain_body');

  return (
    <>
      {/* Photo hero with diagnosis overlay */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <CropPhoto cropId={cropId} diseaseId={disease.id} height={190} rounded={false} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(15,40,28,0.85) 8%, transparent 60%)',
          display: 'flex', alignItems: 'flex-end', padding: 16,
        }}>
          <div>
            <span className="pill" style={{ background: uncertain ? 'var(--warn)' : 'var(--green)', color: '#fff' }}>
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

        {regionalNote && (
          <div style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
            ⚠️ {pick(regionalNote)}
          </div>
        )}
        {uncertain && (
          <div className="card--tint" style={{ borderRadius: 'var(--radius)', padding: 14 }}>
            <strong style={{ color: 'var(--green-deep)' }}>{t('uncertain_title')}</strong>
            <p style={{ margin: '6px 0 0' }} className="muted">{note}</p>
          </div>
        )}
      </div>

      <h3 style={{ margin: '22px 4px 10px' }}>💊 {t('treatments')}</h3>
      {disease.treatments.map((tr) => (
        <div key={tr.id} style={{ marginBottom: 14 }}>
          <TreatmentCard treatment={tr} region={region} />
        </div>
      ))}

      <DiseaseVideos disease={disease} />
    </>
  );
}
