import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { TopBar } from './components/Chrome.jsx';
import Home from './screens/Home.jsx';
import CropSelect from './screens/CropSelect.jsx';
import RegionSelect from './screens/RegionSelect.jsx';
import PhotoGuide from './screens/PhotoGuide.jsx';
import SymptomChecklist from './screens/SymptomChecklist.jsx';
import Result from './screens/Result.jsx';
import Dashboard from './screens/Dashboard.jsx';
import { diagnoseOffline } from './engine/symptomMatcher';
import { saveReport, queueForVision } from './db/storage';

function DiagnosisFlow() {
  const [step, setStep] = useState('home');
  // Accumulated session state across the flow.
  const [session, setSession] = useState({
    cropId: null,
    region: null,
    photoBlob: null,
    answers: {},
    result: null,
    report: null,
  });
  const navigate = useNavigate();

  const go = (next) => setStep(next);
  const patch = (p) => setSession((s) => ({ ...s, ...p }));

  const reset = () => {
    setSession({ cropId: null, region: null, photoBlob: null, answers: {}, result: null, report: null });
    setStep('home');
  };

  // Run the offline matcher, persist the report, and queue the photo for Claude
  // Vision if the offline confidence was below threshold.
  const runDiagnosis = useCallback(
    async (answers) => {
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
      go('result');
    },
    [session.cropId, session.region, session.photoBlob]
  );

  return (
    <div className="app-shell">
      <TopBar />
      {step === 'home' && (
        <Home onStart={() => go('crop')} onDashboard={() => navigate('/dashboard')} />
      )}
      {step === 'crop' && (
        <CropSelect
          onPick={(cropId) => { patch({ cropId }); go('region'); }}
          onBack={() => go('home')}
        />
      )}
      {step === 'region' && (
        <RegionSelect
          onPick={(region) => { patch({ region }); go('photo'); }}
          onBack={() => go('crop')}
        />
      )}
      {step === 'photo' && (
        <PhotoGuide
          onPhoto={(photoBlob) => { patch({ photoBlob }); go('symptoms'); }}
          onSkip={() => { patch({ photoBlob: null }); go('symptoms'); }}
          onBack={() => go('region')}
        />
      )}
      {step === 'symptoms' && (
        <SymptomChecklist
          cropId={session.cropId}
          onDone={runDiagnosis}
          onBack={() => go('photo')}
        />
      )}
      {step === 'result' && <Result session={session} onRestart={reset} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DiagnosisFlow />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
