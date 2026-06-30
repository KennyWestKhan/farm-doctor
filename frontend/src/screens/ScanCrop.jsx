import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import { useOnline } from '../components/useOnline';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import AiTag from '../components/AiTag.jsx';
import ScanLoading from '../components/ScanLoading.jsx';
import { CROPS, getDisease, matchCropByName, matchDiseaseByName } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import { saveReport, updateReport } from '../db/storage';
import { getSavedRegion } from '../utils/prefs';
import { bumpScanCount } from '../utils/scanCount.js';
import { sanitizeText, LIMITS } from '../utils/sanitize.js';
import { apiFetch } from '../utils/apiFetch.js';
import ReviewPrompt from '../components/ReviewPrompt.jsx';

const API = import.meta.env.VITE_API_URL || '';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ScanCrop() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const online = useOnline();
  const inputRef = useRef(null);

  const [step, setStep] = useState('capture'); // capture | preview | loading | result | unclear
  const [vision, setVision] = useState(null);
  const [cropId, setCropId] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [note, setNote] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const region = getSavedRegion();
  const canScan = online && API;

  // Auto-open camera on mount. If offline, redirect to questionnaire.
  useEffect(() => {
    if (!canScan) {
      nav('/diagnose', { replace: true });
      return;
    }
    const t = setTimeout(() => inputRef.current?.click(), 120);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const matchedId = vision ? matchDiseaseByName(cropId, vision.disease) : null;
  const disease = matchedId ? getDisease(matchedId) : null;
  const conf = typeof vision?.confidence === 'number' ? vision.confidence : 0;
  const status = matchedId && conf >= 0.7 ? 'confident' : matchedId ? 'uncertain' : 'no_match';

  function onFilePicked(file) {
    if (!file) return;
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    setStep('preview');
  }

  async function submitPhoto() {
    if (!pendingFile) return;
    setStep('loading');
    setCanRetry(false);
    try {
      const imageBase64 = await fileToBase64(pendingFile);
      const cleanNote = sanitizeText(note, LIMITS.note);
      const res = await apiFetch('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mediaType: pendingFile.type || 'image/jpeg', note: cleanNote || undefined }),
      });
      if (res.status === 429) {
        setFeedback(t('scan_limit_reached'));
        setStep('unclear');
        return;
      }
      if (!res.ok) {
        // 5xx is the server's fault and worth a one-tap retry; other non-OK
        // statuses (4xx besides 429) are unlikely here but treated the same way.
        setFeedback(t('scan_server_error'));
        setCanRetry(true);
        setStep('unclear');
        return;
      }
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
    } catch (err) {
      // Distinguish *why* the request failed so the farmer knows what to do —
      // a stuck "Looking at your crop…" with no explanation was the bug report.
      if (err?.name === 'TimeoutError') {
        setFeedback(t('scan_timeout'));
      } else if (err?.name === 'AbortError') {
        setFeedback(t('scan_timeout'));
      } else if (!navigator.onLine) {
        setFeedback(t('scan_needs_internet'));
      } else {
        setFeedback(t('scan_network_error'));
      }
      setCanRetry(true);
      setStep('unclear');
    }
  }

  function changeCrop(newCropId) {
    setCropId(newCropId);
    if (reportId && vision) {
      const did = matchDiseaseByName(newCropId, vision.disease);
      const st = did && conf >= 0.7 ? 'confident' : did ? 'uncertain' : 'no_match';
      updateReport(reportId, { cropId: newCropId, topDiseaseId: did, status: st });
    }
  }

  function restart() {
    setVision(null);
    setCropId(null);
    setReportId(null);
    setNote('');
    setPendingFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setStep('capture');
    setTimeout(() => inputRef.current?.click(), 120);
  }

  // Hidden file input — shared across all steps
  const fileInput = (
    <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFilePicked(e.target.files?.[0]); e.target.value = ''; }} />
  );

  // ---- capture (camera opens automatically) ----
  if (step === 'capture') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={() => nav(-1)} />
        <div className="stagger stack" style={{ marginTop: 6 }}>
          <div className="card center stack">
            <div style={{ fontSize: 52 }}>🌿📷</div>
            <p className="muted" style={{ margin: 0 }}>{t('scan_crop_desc')}</p>
          </div>
        </div>
        {fileInput}
        <div className="sticky-cta">
          <button className="btn btn--block" onClick={() => inputRef.current?.click()}>📷 {t('scan_crop_cta')}</button>
        </div>
      </div>
    );
  }

  // ---- preview (photo taken, add optional note before sending) ----
  if (step === 'preview') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={restart} />
        {fileInput}
        <div className="stagger stack" style={{ marginTop: 6 }}>
          <div className="card center">
            <img
              src={preview}
              alt={t('scan_crop_title')}
              style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 'var(--radius)' }}
            />
          </div>
          <div className="card stack" style={{ gap: 6 }}>
            <label className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('scan_note_label')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(sanitizeText(e.target.value, LIMITS.note))}
              placeholder={t('scan_note_placeholder')}
              rows={2}
              maxLength={LIMITS.note}
              style={{ width: '100%', padding: 12, fontSize: 15, fontFamily: 'var(--font-body)', border: '2px solid var(--line)', borderRadius: 'var(--radius)', background: '#fff', color: 'var(--ink)', resize: 'vertical' }}
            />
            <span className="muted" style={{ fontSize: 11, textAlign: 'right' }}>{note.length}/{LIMITS.note}</span>
          </div>
        </div>
        <div className="sticky-cta" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--tint" onClick={() => inputRef.current?.click()} style={{ flex: 0 }}>📷</button>
          <button className="btn btn--block" onClick={submitPhoto} style={{ flex: 1 }}>{t('scan_crop_send')}</button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={restart} />
        {fileInput}
        <ScanLoading
          icon="🔎"
          steps={[
            t('scan_step_uploading'),
            t('scan_crop_reading'),
            t('scan_step_matching'),
            t('scan_step_finalizing'),
          ]}
        />
      </div>
    );
  }

  if (step === 'unclear') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={restart} />
        {fileInput}
        <div className="stagger stack">
          <div className="card center stack" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 48 }}>{canRetry ? '⚠️' : '🤔'}</div>
            <p className="muted" style={{ margin: 0 }}>{feedback}</p>
          </div>
          {canRetry && (
            <button className="btn btn--block" onClick={submitPhoto}>↻ {t('try_again')}</button>
          )}
          <button className={canRetry ? 'btn btn--tint btn--block' : 'btn btn--block'} onClick={restart}>📷 {t('scan_crop_cta')}</button>
          <button className="btn btn--tint btn--block" onClick={() => nav('/diagnose')}>📋 {t('scan_use_questions')}</button>
        </div>
      </div>
    );
  }

  // ---- result ----
  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={() => nav('/')} action={<AiTag vision={vision} />} />
      {fileInput}
      <div className="stagger">
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
