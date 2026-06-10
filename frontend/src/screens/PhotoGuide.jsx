import { useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { BackButton } from '../components/Chrome.jsx';

const TIPS = [
  { icon: '☀️', key: 'photo_tip_daylight' },
  { icon: '🎯', key: 'photo_tip_close' },
  { icon: '✌️', key: 'photo_tip_compare' },
  { icon: '📷', key: 'photo_tip_steady' },
];

export default function PhotoGuide({ onPhoto, onSkip, onBack }) {
  const { t } = useLang();
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onPhoto(file); // a Blob; stored in IndexedDB, sent to Vision when online
  };

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <div>
        <h2>📸 {t('photo_guide_title')}</h2>
        <div className="kente-rule" style={{ width: 80, margin: '12px 0 4px' }} />
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {TIPS.map((tip) => (
          <div key={tip.key} className="card row" style={{ gap: 14 }}>
            <span style={{ fontSize: 34 }}>{tip.icon}</span>
            <strong style={{ fontSize: 18 }}>{t(tip.key)}</strong>
          </div>
        ))}

        {/* Video placeholder — real 30s farmer demo swaps in here later */}
        <div
          className="card center"
          style={{ background: 'var(--soil)', color: '#fff', padding: 22 }}
        >
          <div style={{ fontSize: 40 }}>▶️</div>
          <strong>{t('watch_video')}</strong>
          <div className="muted" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            (video coming soon)
          </div>
        </div>
      </div>

      {/* `capture="environment"` opens the rear camera directly on Android */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />

      <div className="stack" style={{ marginTop: 20 }}>
        <button className="btn" onClick={() => inputRef.current?.click()}>
          📷 {t('ready_take')}
        </button>
        <button className="btn btn--ghost" onClick={onSkip}>
          {t('skip_photo')}
        </button>
      </div>
    </div>
  );
}
