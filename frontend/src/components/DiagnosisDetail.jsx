import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import CropPhoto from './CropPhoto.jsx';
import TreatmentCard from './TreatmentCard.jsx';
import DiseaseVideos from './DiseaseVideos.jsx';
import FarmSizePicker from './FarmSizePicker.jsx';
import { STORAGE_TIPS } from '../data/storageTips.js';
import { initialLoadsForCrop } from '../utils/prefs.js';

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
export default function DiagnosisDetail({ cropId, disease, confidencePct, uncertain, regionalNote, region, uncertainNote, infoMode = false }) {
  const { t, pick } = useLang();
  const [storageOpen, setStorageOpen] = useState(false);
  // Pre-filled from the farmer's saved farm size (or a medium-farm suggestion
  // for this crop) so a total shows immediately — adjustable via the picker.
  // Info mode is a read-only knowledge page: no farm-size prompt, no totals.
  const [loads, setLoads] = useState(() => (infoMode ? null : initialLoadsForCrop(cropId)));
  // The "not fully sure" copy depends on the source: an offline guess promises an
  // AI recheck when online; an AI result (scan / rechecked) does not.
  const note = uncertainNote ?? t('uncertain_body');
  const storageTip = !uncertain ? STORAGE_TIPS[cropId] : null;

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
            {!infoMode && (
              <span className="pill" style={{ background: uncertain ? 'var(--warn)' : 'var(--green)', color: '#fff' }}>
                {confidencePct}% {t('confidence')}
              </span>
            )}
            <h2 style={{ color: '#fff', marginTop: infoMode ? 0 : 8 }}>{pick(disease.name)}</h2>
          </div>
        </div>
      </div>

      {/* Detail card */}
      <div className="card stack" style={{ marginTop: 14 }}>
        {!infoMode && (
          <div className="meter"><span style={{ '--to': `${confidencePct}%`, background: uncertain ? 'var(--warn)' : 'var(--green)' }} /></div>
        )}
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
      {!infoMode && (
        <div style={{ marginBottom: 14 }}>
          <FarmSizePicker cropId={cropId} loads={loads} onChange={setLoads} />
        </div>
      )}
      {disease.treatments.map((tr) => (
        <div key={tr.id} style={{ marginBottom: 14 }}>
          <TreatmentCard treatment={tr} region={region} loads={loads} />
        </div>
      ))}

      <DiseaseVideos disease={disease} />

      {storageTip && (
        <div className="card" style={{ marginTop: 14 }}>
          <button
            onClick={() => setStorageOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
          >
            <span style={{ fontSize: 22 }}>🌾</span>
            <strong style={{ flex: 1, fontFamily: 'var(--font-display)' }}>{t('storage_title')}</strong>
            <span style={{ color: 'var(--green)' }}>{storageOpen ? '▲' : '▼'}</span>
          </button>
          {storageOpen && (
            <div className="stack" style={{ marginTop: 12 }}>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--green-deep)' }}>{t('storage_drying')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{pick(storageTip.drying)}</p>
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--green-deep)' }}>{t('storage_storage')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{pick(storageTip.storage)}</p>
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--green-deep)' }}>{t('storage_signs')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{pick(storageTip.signs_of_spoilage)}</p>
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--green-deep)' }}>{t('storage_duration')}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>{pick(storageTip.duration)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
