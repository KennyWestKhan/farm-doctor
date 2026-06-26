import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import { useOnline } from '../components/useOnline';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import AiTag from '../components/AiTag.jsx';
import { CROPS, getDisease, matchCropByName, matchDiseaseByName } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import { saveReport, updateReport } from '../db/storage';
import { getSavedRegion } from '../utils/prefs';
import { bumpScanCount } from '../utils/scanCount.js';
import { apiFetch } from '../utils/apiFetch.js';
import ReviewPrompt from '../components/ReviewPrompt.jsx';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Scan-my-crop: straight to the camera (no crop-picking step). Claude Vision
 * identifies BOTH the crop and the disease; the result shows the diagnosis with
 * a crop dropdown pre-filled with the detected crop, which the farmer can correct
 * (re-deriving the disease within the chosen crop).
 */
export default function ScanCrop() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const online = useOnline();
  const inputRef = useRef(null);

  const [step, setStep] = useState('capture'); // capture | loading | result | unclear
  const [vision, setVision] = useState(null);
  const [cropId, setCropId] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const region = getSavedRegion();
  const canScan = online && API;

  // Derive the diagnosis for the currently-selected crop from the AI's disease text.
  const matchedId = vision ? matchDiseaseByName(cropId, vision.disease) : null;
  const disease = matchedId ? getDisease(matchedId) : null;
  const conf = typeof vision?.confidence === 'number' ? vision.confidence : 0;
  const status = matchedId && conf >= 0.7 ? 'confident' : matchedId ? 'uncertain' : 'no_match';

  async function onPhoto(file) {
    if (!file) return;
    setStep('loading');
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await apiFetch('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mediaType: file.type || 'image/jpeg' }),
      });
      if (res.status === 429) {
        setFeedback(t('scan_limit_reached'));
        setStep('unclear');
        return;
      }
      if (!res.ok) throw new Error('vision failed');
      const v = await res.json();
      const detectedCrop = matchCropByName(v.crop) || CROPS[0].id;
      const did = matchDiseaseByName(detectedCrop, v.disease);
      const c = typeof v.confidence === 'number' ? v.confidence : 0;
      const st = did && c >= 0.7 ? 'confident' : did ? 'uncertain' : 'no_match';

      const report = await saveReport({ cropId: detectedCrop, region, topDiseaseId: did, confidence: c, status: st, hadPhoto: true, vision: v, rechecked: true });

      setVision(v);
      setCropId(detectedCrop);
      setReportId(report.id);
      bumpScanCount();

      if (did) setStep('result');
      else { setFeedback(v.feedback_if_unclear || t('scan_crop_unclear')); setStep('unclear'); }
    } catch {
      setFeedback(t('scan_failed'));
      setStep('unclear');
    }
  }

  // Farmer corrects the crop → re-derive disease and update the saved report.
  function changeCrop(newCropId) {
    setCropId(newCropId);
    if (reportId && vision) {
      const did = matchDiseaseByName(newCropId, vision.disease);
      const st = did && conf >= 0.7 ? 'confident' : did ? 'uncertain' : 'no_match';
      updateReport(reportId, { cropId: newCropId, topDiseaseId: did, status: st });
    }
  }

  const restart = () => { setVision(null); setCropId(null); setReportId(null); setStep('capture'); };

  // ---- capture (entry) ----
  if (step === 'capture') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={() => nav('/scan')} />
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
        <Header title={t('scan_crop_title')} onBack={restart} />
        <div className="card center stack" style={{ marginTop: 40 }}>
          <div className="pop" style={{ fontSize: 48 }}>🔎</div>
          <strong style={{ fontFamily: 'var(--font-display)' }}>{t('scan_crop_reading')}</strong>
          <div className="meter" style={{ width: '100%' }}><span style={{ '--to': '92%' }} /></div>
        </div>
      </div>
    );
  }

  if (step === 'unclear') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={restart} />
        <div className="stagger stack">
          <div className="card center stack" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 48 }}>🤔</div>
            <p className="muted" style={{ margin: 0 }}>{feedback}</p>
          </div>
          <button className="btn btn--block" onClick={() => setStep('capture')}>📷 {t('scan_crop_cta')}</button>
          <button className="btn btn--tint btn--block" onClick={() => nav('/diagnose')}>📋 {t('scan_use_questions')}</button>
        </div>
      </div>
    );
  }

  // ---- result ----
  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={() => nav('/scan')} action={<AiTag vision={vision} />} />
      <div className="stagger">
        {/* Editable crop — prefilled with what the AI detected */}
        <div className="card" style={{ marginBottom: 14 }}>
          <label className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('scan_crop_label')}
          </label>
          <select
            value={cropId}
            onChange={(e) => changeCrop(e.target.value)}
            style={{ width: '100%', marginTop: 8, padding: 14, fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', border: '2px solid var(--line)', borderRadius: 'var(--radius)', background: '#fff' }}
          >
            {CROPS.map((c) => <option key={c.id} value={c.id}>{pick(c.name)}</option>)}
          </select>
        </div>

        {disease ? (
          <DiagnosisDetail
            cropId={cropId}
            disease={disease}
            confidencePct={Math.round(conf * 100)}
            uncertain={status !== 'confident'}
            regionalNote={status === 'confident' ? buildRegionalNote(disease, region, new Date()) : null}
            region={region}
            uncertainNote={t('uncertain_ai_body')}
          />
        ) : (
          <div className="card center stack">
            <div style={{ fontSize: 44 }}>🤔</div>
            <p className="muted" style={{ margin: 0 }}>{t('scan_crop_unclear')}</p>
            <button className="btn btn--tint btn--block" onClick={() => nav('/diagnose')}>📋 {t('scan_use_questions')}</button>
          </div>
        )}

        <button className="btn btn--tint btn--block" onClick={restart} style={{ marginTop: 14 }}>📷 {t('scan_again')}</button>
      </div>
      <ReviewPrompt />
    </div>
  );
}
