import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import { useOnline } from '../components/useOnline';
import CropSelect from './CropSelect.jsx';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import { getDisease, matchDiseaseByName } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import { saveReport } from '../db/storage';
import { getSavedRegion } from '../utils/prefs';

const API = import.meta.env.VITE_API_URL || '';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Scan-my-crop: pick crop → photograph the plant → Claude Vision diagnoses →
 * reconstruct full treatments via our DB and save a report. Online-only (Vision
 * needs internet); no AWS needed. Falls back to the symptom checklist when the
 * photo is unclear.
 */
export default function ScanCrop() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const online = useOnline();
  const inputRef = useRef(null);

  const [step, setStep] = useState('crop'); // crop | photo | loading | result | unclear
  const [cropId, setCropId] = useState(null);
  const [diag, setDiag] = useState(null); // { disease, confidencePct, uncertain, regionalNote, vision }
  const [feedback, setFeedback] = useState('');

  const region = getSavedRegion();
  const canScan = online && API;

  async function onPhoto(file) {
    if (!file) return;
    setStep('loading');
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await fetch(`${API}/api/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mediaType: file.type || 'image/jpeg' }),
      });
      if (!res.ok) throw new Error('vision failed');
      const vision = await res.json();

      const matchedId = matchDiseaseByName(cropId, vision.disease);
      const conf = typeof vision.confidence === 'number' ? vision.confidence : 0;
      const status = matchedId && conf >= 0.7 ? 'confident' : matchedId ? 'uncertain' : 'no_match';

      // Save so it shows in Reports, with the raw AI result attached.
      await saveReport({ cropId, region, topDiseaseId: matchedId, confidence: conf, status, hadPhoto: true, vision, rechecked: true });

      if (matchedId) {
        const disease = getDisease(matchedId);
        setDiag({
          disease,
          confidencePct: Math.round(conf * 100),
          uncertain: status !== 'confident',
          regionalNote: status === 'confident' ? buildRegionalNote(disease, region, new Date()) : null,
          vision,
        });
        setStep('result');
      } else {
        setFeedback(vision.feedback_if_unclear || t('scan_crop_unclear'));
        setStep('unclear');
      }
    } catch {
      setFeedback(t('scan_failed'));
      setStep('unclear');
    }
  }

  if (step === 'crop') {
    return <CropSelect onPick={(id) => { setCropId(id); setStep('photo'); }} onBack={() => nav('/scan')} />;
  }

  if (step === 'photo') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={() => setStep('crop')} />
        <div className="stagger stack" style={{ marginTop: 6 }}>
          <div className="card center stack">
            <div style={{ fontSize: 52 }}>🌿📷</div>
            <p className="muted" style={{ margin: 0 }}>{t('scan_crop_desc')}</p>
          </div>
          {!canScan && (
            <div style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
              📶 {t('scan_needs_internet')}
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <div className="sticky-cta">
          <button className="btn btn--block" disabled={!canScan} onClick={() => inputRef.current?.click()}>📷 {t('scan_crop_cta')}</button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={() => setStep('photo')} />
        <div className="card center stack" style={{ marginTop: 40 }}>
          <div className="pop" style={{ fontSize: 48 }}>🔎</div>
          <strong style={{ fontFamily: 'var(--font-display)' }}>{t('scan_crop_reading')}</strong>
          <div className="meter" style={{ width: '70%' }}><span style={{ '--to': '90%' }} /></div>
        </div>
      </div>
    );
  }

  if (step === 'unclear') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={() => setStep('crop')} />
        <div className="stagger stack">
          <div className="card center stack" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 48 }}>🤔</div>
            <p className="muted" style={{ margin: 0 }}>{feedback}</p>
          </div>
          <button className="btn btn--block" onClick={() => setStep('photo')}>📷 {t('scan_crop_cta')}</button>
          <button className="btn btn--tint btn--block" onClick={() => nav('/diagnose')}>📋 {t('scan_use_questions')}</button>
        </div>
      </div>
    );
  }

  // result
  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={() => nav('/scan')} />
      <div className="stagger">
        <DiagnosisDetail
          cropId={cropId}
          disease={diag.disease}
          confidencePct={diag.confidencePct}
          uncertain={diag.uncertain}
          regionalNote={diag.regionalNote}
          region={region}
          uncertainNote={t('uncertain_ai_body')}
        />
        {diag.vision?.symptoms_observed && (
          <div className="card" style={{ background: 'var(--green-tint)', marginTop: 14 }}>
            <span className="pill pill--green" style={{ marginBottom: 8 }}>🤖 {t('ai_observed')}</span>
            <div style={{ fontSize: 15 }}>{diag.vision.symptoms_observed}</div>
          </div>
        )}
        <button className="btn btn--tint btn--block" onClick={() => { setStep('crop'); setCropId(null); setDiag(null); }} style={{ marginTop: 14 }}>
          📷 {t('scan_again')}
        </button>
      </div>
    </div>
  );
}
