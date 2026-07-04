import { useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import YouTubeButton from '../components/YouTubeButton.jsx';

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
    if (file) onPhoto(file);
  };

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

        {/* A working YouTube search, same fallback pattern as DiseaseVideos —
            no curated video exists for "how to photograph a sick plant" so we
            never claim one is coming, just link straight to a real search. Same
            YouTube button as everywhere else, so the cue stays consistent. */}
        <YouTubeButton
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent('how to photograph a sick crop for diagnosis')}`}
          label={t('watch_video')}
        />
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />

      <div className="sticky-cta stack" style={{ marginTop: 'auto' }}>
        <button className="btn btn--block" onClick={() => inputRef.current?.click()}>📷 {t('ready_take')}</button>
        <button className="btn btn--tint btn--block" onClick={onSkip}>{t('skip_photo')}</button>
      </div>
    </div>
  );
}
