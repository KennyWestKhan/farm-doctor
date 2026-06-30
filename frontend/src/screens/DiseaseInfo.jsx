import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { getDisease, SYMPTOM_QUESTIONS } from '../data/diseaseDatabase';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import { Header } from '../components/Chrome.jsx';
import { getSavedRegion } from '../utils/prefs';

/**
 * Read-only knowledge page for a single disease, reached from the Home search.
 * Reuses DiagnosisDetail (in info mode — no confidence pill/meter, since nothing
 * was diagnosed) to show the photo, description, treatments, videos and storage
 * tips, plus a CTA to scan the crop if the farmer wants to confirm. Fully offline.
 */
export default function DiseaseInfo() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const { id } = useParams();
  const disease = getDisease(id);
  const region = getSavedRegion();

  if (!disease) {
    return (
      <div className="screen page-enter">
        <Header title={t('diagnosis')} onBack={() => nav('/')} />
        <div className="card center stack" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 52 }}>🤔</div>
          <h3>{t('no_match_title')}</h3>
        </div>
      </div>
    );
  }

  // Symptom questions describe what the disease looks like — useful "signs" copy.
  const signs = disease.symptoms
    .map((s) => SYMPTOM_QUESTIONS[s.key])
    .filter(Boolean);

  return (
    <div className="screen page-enter">
      <Header title={t('disease_about')} onBack={() => nav('/')} />
      <div className="stagger">
        <DiagnosisDetail
          cropId={disease.cropId}
          disease={disease}
          region={region}
          confidencePct={0}
          uncertain={false}
          regionalNote={null}
          infoMode
        />

        {signs.length > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <h3 style={{ margin: '0 0 10px' }}>👀 {t('disease_signs')}</h3>
            <div className="stack" style={{ gap: 8 }}>
              {signs.map((q, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)' }}>•</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{pick(q)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm the guess by scanning the real crop. */}
        <button
          className="btn btn--block"
          onClick={() => nav('/scan/crop')}
          style={{ marginTop: 18 }}
        >
          📷 {t('disease_verify_cta')}
        </button>
        <p className="muted center" style={{ fontSize: 13, marginTop: 8 }}>{t('disease_verify_hint')}</p>
      </div>
    </div>
  );
}
