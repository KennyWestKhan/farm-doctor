import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CropSelect from './CropSelect.jsx';
import RegionSelect from './RegionSelect.jsx';
import PhotoGuide from './PhotoGuide.jsx';
import SymptomChecklist from './SymptomChecklist.jsx';
import Result from './Result.jsx';
import { diagnoseOffline } from '../engine/symptomMatcher';
import { saveReport, queueForVision } from '../db/storage';
import { syncNow } from '../db/sync';
import { getSavedRegion } from '../utils/prefs';
import { bumpScanCount } from '../utils/scanCount.js';

/**
 * The /diagnose tab. A linear step machine: crop -> region -> photo -> symptoms
 * -> result. Runs the offline matcher, persists a report, and queues the photo
 * for Claude Vision when the offline confidence is low.
 */
export default function DiagnoseFlow() {
  const navigate = useNavigate();
  // A crop may be preselected from the Home search (router state).
  const preCrop = useLocation().state?.cropId || null;
  // Region is asked once and saved; skip the step on subsequent diagnoses.
  const savedRegion = getSavedRegion();
  const skipRegion = !!savedRegion;
  const firstStep = preCrop ? (skipRegion ? 'photo' : 'region') : 'crop';
  const [step, setStep] = useState(firstStep);
  const [session, setSession] = useState({
    cropId: preCrop, region: savedRegion, photoBlob: null, answers: {}, result: null, report: null,
  });

  const go = (s) => setStep(s);
  const patch = (p) => setSession((s) => ({ ...s, ...p }));
  const reset = () => {
    setSession({ cropId: null, region: null, photoBlob: null, answers: {}, result: null, report: null });
    setStep('crop');
  };

  const runDiagnosis = useCallback(async (answers) => {
    const result = diagnoseOffline(session.cropId, answers, session.region);
    const report = await saveReport({
      cropId: session.cropId,
      region: session.region,
      topDiseaseId: result.top?.disease.id ?? null,
      confidence: result.top?.confidence ?? 0,
      status: result.status,
      hadPhoto: !!session.photoBlob,
    });
    if (result.needsVision && session.photoBlob) {
      await queueForVision({ reportId: report.id, cropId: session.cropId, photoBlob: session.photoBlob });
    }
    patch({ answers, result, report });
    bumpScanCount();
    go('result');
    // Flush this new report (and any Vision queue) to the server now, so it
    // shows up on the impact dashboard without waiting for the next app launch.
    syncNow();
  }, [session.cropId, session.region, session.photoBlob]);

  // Back from the first step leaves the flow entirely (to Home).
  const leave = () => navigate('/');

  switch (step) {
    case 'crop':
      return <CropSelect onPick={(cropId) => { patch({ cropId }); go(skipRegion ? 'photo' : 'region'); }} onBack={leave} />;
    case 'region':
      return <RegionSelect onPick={(region) => { patch({ region }); go('photo'); }} onBack={() => go('crop')} />;
    case 'photo':
      return (
        <PhotoGuide
          onPhoto={(photoBlob) => { patch({ photoBlob }); go('symptoms'); }}
          onSkip={() => { patch({ photoBlob: null }); go('symptoms'); }}
          onBack={() => go(skipRegion ? 'crop' : 'region')}
        />
      );
    case 'symptoms':
      return <SymptomChecklist cropId={session.cropId} onDone={runDiagnosis} onBack={() => go('photo')} />;
    case 'result':
      return <Result session={session} onRestart={reset} onHome={leave} />;
    default:
      return null;
  }
}
