import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import { useOnline } from '../components/useOnline';
import DiagnosisDetail from '../components/DiagnosisDetail.jsx';
import AiTag from '../components/AiTag.jsx';
import ScanLoading from '../components/ScanLoading.jsx';
import CropSelect from './CropSelect.jsx';
import PhotoPickInputs, { openCamera, openGallery } from '../components/PhotoPickInputs.jsx';
import { CROPS, getDisease, matchDiseaseByName } from '../data/diseaseDatabase';
import { buildRegionalNote } from '../engine/symptomMatcher';
import { saveReport, updateReport } from '../db/storage';
import { getSavedRegion, getSavedCrops } from '../utils/prefs';
import { bumpScanCount } from '../utils/scanCount.js';
import { sanitizeText, LIMITS } from '../utils/sanitize.js';
import { apiFetch } from '../utils/apiFetch.js';
import { warmBackend } from '../utils/warmBackend.js';
import { syncNow } from '../db/sync.js';
import ReviewPrompt from '../components/ReviewPrompt.jsx';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Prefer backend catalog disease_id; fall back to fuzzy name match. */
function resolveDiseaseId(cropId, vision) {
  if (vision?.disease_id && getDisease(vision.disease_id)) return vision.disease_id;
  return matchDiseaseByName(cropId, vision?.disease);
}

export default function ScanCrop() {
  const { t, pick } = useLang();
  const nav = useNavigate();
  const online = useOnline();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const savedCrops = getSavedCrops();
  const [step, setStep] = useState('crop'); // crop | capture | preview | loading | result | unclear
  const [vision, setVision] = useState(null);
  // Farmer's pick (hint). Null = "Not sure — detect from photo".
  const [farmerCropId, setFarmerCropId] = useState(savedCrops[0] || null);
  // Crop used for diagnosis (Vision's call after soft prior).
  const [cropId, setCropId] = useState(savedCrops[0] || null);
  const [reportId, setReportId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [note, setNote] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const region = getSavedRegion();
  const canScan = online && (import.meta.env.VITE_API_URL || '');

  function goToQuestions() {
    // They already refused the camera — don't dump them on "take a good photo".
    nav('/diagnose', {
      state: {
        skipPhoto: true,
        ...(cropId || farmerCropId ? { cropId: cropId || farmerCropId } : {}),
      },
    });
  }

  // If offline, redirect to questionnaire. Warm backend once crop is known.
  useEffect(() => {
    if (!canScan) {
      nav('/diagnose', { replace: true, state: { skipPhoto: true } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warm the backend while the farmer picks take vs upload. Do not auto-open
  // the camera — that forced capture and blocked gallery picks on phones.
  useEffect(() => {
    if (step === 'capture' && canScan) warmBackend();
  }, [step, canScan]);

  const matchedId = vision ? resolveDiseaseId(cropId, vision) : null;
  const disease = matchedId ? getDisease(matchedId) : null;
  const conf = typeof vision?.confidence === 'number' ? vision.confidence : 0;
  const status = matchedId && conf >= 0.7 ? 'confident' : matchedId ? 'uncertain' : 'no_match';
  const cropMismatch = !!(vision?.crop_mismatch && farmerCropId && cropId && farmerCropId !== cropId);

  function pickCrop(id) {
    setFarmerCropId(id);
    setCropId(id);
    setStep('capture');
  }

  function pickUnsure() {
    setFarmerCropId(null);
    setCropId(null);
    setStep('capture');
  }

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
        body: JSON.stringify({
          imageBase64,
          mediaType: pendingFile.type || 'image/jpeg',
          note: cleanNote || undefined,
          // Soft prior only — omit when farmer tapped "Not sure".
          ...(farmerCropId ? { cropId: farmerCropId } : {}),
        }),
      });
      if (res.status === 429) {
        setFeedback(t('scan_limit_reached'));
        setStep('unclear');
        return;
      }
      if (!res.ok) {
        setFeedback(t('scan_server_error'));
        setCanRetry(true);
        setStep('unclear');
        return;
      }
      const v = await res.json();
      // Trust Vision's crop_id (may override a wrong farmer pick).
      const resolvedCrop = v.crop_id || farmerCropId || CROPS[0].id;
      const did = resolveDiseaseId(resolvedCrop, v);
      const c = typeof v.confidence === 'number' ? v.confidence : 0;
      const st = did && c >= 0.7 ? 'confident' : did ? 'uncertain' : 'no_match';

      const report = await saveReport({
        cropId: resolvedCrop,
        region,
        topDiseaseId: did,
        confidence: c,
        status: st,
        hadPhoto: true,
        vision: v,
        rechecked: true,
        source: 'scan',
      });

      setCropId(resolvedCrop);
      setVision(v);
      setReportId(report.id);
      bumpScanCount();
      syncNow();

      if (did) setStep('result');
      else {
        setFeedback(v.feedback_if_unclear || t('scan_crop_unclear'));
        setStep('unclear');
      }
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
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
      const did = resolveDiseaseId(newCropId, vision);
      const st = did && conf >= 0.7 ? 'confident' : did ? 'uncertain' : 'no_match';
      updateReport(reportId, { cropId: newCropId, topDiseaseId: did, status: st });
    }
  }

  function restart() {
    setVision(null);
    setReportId(null);
    setNote('');
    setPendingFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setStep('capture');
  }

  function restartFromCrop() {
    restart();
    setFarmerCropId(savedCrops[0] || null);
    setCropId(savedCrops[0] || null);
    setStep('crop');
  }

  function cropLabel(id) {
    const c = CROPS.find((x) => x.id === id);
    return c ? pick(c.name) : id;
  }

  function mismatchMessage() {
    return t('scan_crop_mismatch')
      .replaceAll('{picked}', cropLabel(farmerCropId))
      .replaceAll('{detected}', cropLabel(cropId));
  }

  const fileInputs = (
    <PhotoPickInputs
      onFile={onFilePicked}
      cameraRef={cameraRef}
      galleryRef={galleryRef}
    />
  );

  // ---- pick crop (optional) — "Not sure" still works ----
  if (step === 'crop') {
    return (
      <CropSelect
        onPick={pickCrop}
        onUnsure={pickUnsure}
        onBack={() => nav(-1)}
      />
    );
  }

  if (step === 'capture') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={restartFromCrop} />
        <div className="stagger stack" style={{ marginTop: 6 }}>
          <div className="card center stack">
            <div style={{ fontSize: 52 }}>🌿📷</div>
            <p style={{ margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {farmerCropId ? cropLabel(farmerCropId) : t('scan_crop_detecting')}
            </p>
            <p className="muted" style={{ margin: 0 }}>{t('scan_crop_desc')}</p>
          </div>
        </div>
        {fileInputs}
        <div className="sticky-cta stack">
          <button className="btn btn--block" onClick={() => openCamera(cameraRef)}>
            📷 {t('scan_crop_cta')}
          </button>
          <button className="btn btn--tint btn--block" onClick={() => openGallery(galleryRef)}>
            🖼️ {t('scan_crop_upload')}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_crop_title')} onBack={restart} />
        {fileInputs}
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
          <button className="btn btn--tint" onClick={() => openCamera(cameraRef)} style={{ flex: 0 }} aria-label={t('photo_retake')}>📷</button>
          <button className="btn btn--tint" onClick={() => openGallery(galleryRef)} style={{ flex: 0 }} aria-label={t('photo_choose_other')}>🖼️</button>
          <button className="btn btn--block" onClick={submitPhoto} style={{ flex: 1 }}>{t('scan_crop_send')}</button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_crop_title')} onBack={restart} />
        {fileInputs}
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
        {fileInputs}
        <div className="stagger stack">
          <div className="card center stack" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 48 }}>{canRetry ? '⚠️' : '🤔'}</div>
            <p className="muted" style={{ margin: 0 }}>{feedback}</p>
          </div>
          {canRetry && (
            <button className="btn btn--block" onClick={submitPhoto}>↻ {t('try_again')}</button>
          )}
          <button className={canRetry ? 'btn btn--tint btn--block' : 'btn btn--block'} onClick={restart}>
            📷 {t('scan_crop_cta')}
          </button>
          <button className="btn btn--tint btn--block" onClick={() => openGallery(galleryRef)}>
            🖼️ {t('scan_crop_upload')}
          </button>
          <button className="btn btn--tint btn--block" onClick={goToQuestions}>
            📋 {t('scan_use_questions')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen page-enter">
      <Header title={t('diagnosis')} onBack={() => nav('/')} action={<AiTag vision={vision} />} />
      {fileInputs}
      <div className="stagger">
        {cropMismatch && (
          <div
            className="card"
            style={{
              marginBottom: 14,
              background: 'var(--amber-soft, #FFF8E7)',
              border: '2px solid var(--amber, #E6A817)',
            }}
          >
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{mismatchMessage()}</p>
          </div>
        )}
        <div className="card" style={{ marginBottom: 14 }}>
          <label className="muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('scan_crop_label')}
          </label>
          <select
            value={cropId || ''}
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
            <button className="btn btn--tint btn--block" onClick={goToQuestions}>📋 {t('scan_use_questions')}</button>
          </div>
        )}

        <button className="btn btn--tint btn--block" onClick={restartFromCrop} style={{ marginTop: 14 }}>
          📷 {t('scan_again')}
        </button>
      </div>
      <ReviewPrompt />
    </div>
  );
}
