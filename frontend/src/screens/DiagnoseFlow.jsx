import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CropSelect from './CropSelect.jsx';
import RegionSelect from './RegionSelect.jsx';
import SymptomChecklist from './SymptomChecklist.jsx';
import Result from './Result.jsx';
import { diagnoseOffline } from '../engine/symptomMatcher';
import { saveReport } from '../db/storage';
import { syncNow } from '../db/sync';
import { getSavedRegion } from '../utils/prefs';
import { bumpScanCount } from '../utils/scanCount.js';

/**
 * The /diagnose tab — symptom-checklist path only.
 *
 * Flow: crop → region (once) → symptoms → result.
 * No photo step here. Camera diagnosis lives at /scan/crop; farmers who
 * tapped "answer questions instead" already opted out of taking a picture.
 *
 * Router state: cropId — preselect crop (Home search, or scan → questions).
 */
export default function DiagnoseFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const preCrop = location.state?.cropId || null;
  const savedRegion = getSavedRegion();
  const skipRegion = !!savedRegion;

  const firstStep = preCrop ? (skipRegion ? 'symptoms' : 'region') : 'crop';
  const [step, setStep] = useState(firstStep);
  const [session, setSession] = useState({
    cropId: preCrop,
    region: savedRegion,
    photoBlob: null,
    answers: {},
    result: null,
    report: null,
  });

  const go = (s) => setStep(s);
  const patch = (p) => setSession((s) => ({ ...s, ...p }));
  const reset = () => {
    setSession({
      cropId: null,
      region: savedRegion,
      photoBlob: null,
      answers: {},
      result: null,
      report: null,
    });
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
      hadPhoto: false,
    });
    patch({ answers, result, report });
    bumpScanCount();
    go('result');
    syncNow();
  }, [session.cropId, session.region]);

  const leave = () => navigate('/');

  switch (step) {
    case 'crop':
      return (
        <CropSelect
          onPick={(cropId) => {
            patch({ cropId });
            go(skipRegion ? 'symptoms' : 'region');
          }}
          onBack={leave}
        />
      );
    case 'region':
      return (
        <RegionSelect
          onPick={(region) => {
            patch({ region });
            go('symptoms');
          }}
          onBack={() => go('crop')}
        />
      );
    case 'symptoms':
      return (
        <SymptomChecklist
          cropId={session.cropId}
          onDone={runDiagnosis}
          onBack={() => go(skipRegion ? 'crop' : 'region')}
        />
      );
    case 'result':
      return <Result session={session} onRestart={reset} onHome={leave} />;
    default:
      return null;
  }
}
