import { useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import YouTubeButton from '../components/YouTubeButton.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import PhotoPickInputs, { openCamera, openGallery } from '../components/PhotoPickInputs.jsx';

const TIPS = [
  { icon: '☀️', key: 'photo_tip_daylight' },
  { icon: '🎯', key: 'photo_tip_close' },
  { icon: '✌️', key: 'photo_tip_compare' },
  { icon: '📷', key: 'photo_tip_steady' },
];

export default function PhotoGuide({ onPhoto, onSkip, onBack }) {
  const { t } = useLang();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  // The in-app camera (framing reticle) is the default; it falls back to the
  // OS camera (the file input) on any error or on the user's request.
  const [showCamera, setShowCamera] = useState(false);

  const handleFile = (file) => {
    if (file) onPhoto(file);
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(blob) => { setShowCamera(false); onPhoto(blob); }}
        onCancel={() => setShowCamera(false)}
        onFallback={() => { setShowCamera(false); openCamera(cameraRef); }}
      />
    );
  }

  return (
    <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header title={t('photo_guide_title')} onBack={onBack} />

      <div className="stagger stack" style={{ marginTop: 6 }}>
        {TIPS.map((tip) => (
          <div key={tip.key} className="card row" style={{ gap: 14, padding: 16 }}>
            <span style={{ fontSize: 30 }}>{tip.icon}</span>
            <strong style={{ fontSize: 17 }}>{t(tip.key)}</strong>
          </div>
        ))}

        <YouTubeButton
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent('how to photograph a sick crop for diagnosis')}`}
          label={t('watch_video')}
        />
      </div>

      <PhotoPickInputs onFile={handleFile} cameraRef={cameraRef} galleryRef={galleryRef} />

      <div className="sticky-cta stack" style={{ marginTop: 'auto' }}>
        <button className="btn btn--block" onClick={() => setShowCamera(true)}>📷 {t('ready_take')}</button>
        <button className="btn btn--tint btn--block" onClick={() => openGallery(galleryRef)}>
          🖼️ {t('photo_upload')}
        </button>
        <button className="btn btn--tint btn--block" onClick={onSkip}>{t('skip_photo')}</button>
      </div>
    </div>
  );
}
