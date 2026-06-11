import { useState } from 'react';
import { cropPhoto, diseasePhoto } from '../data/photos';

/**
 * Renders a crop (or disease) photo, falling back to a branded gradient + emoji
 * placeholder when no file is set or the image fails to load. Use everywhere a
 * crop image appears so swapping in real photos later is a one-file change.
 */
export default function CropPhoto({ cropId, diseaseId, height = 160, radius = 'var(--radius-lg)', rounded = true }) {
  const meta = (diseaseId && diseasePhoto(diseaseId)) || cropPhoto(cropId);
  const [failed, setFailed] = useState(false);
  const showImg = meta?.src && !failed;

  const base = {
    height,
    width: '100%',
    borderRadius: rounded ? radius : 0,
    overflow: 'hidden',
    display: 'block',
    objectFit: 'cover',
  };

  if (showImg) {
    return <img src={meta.src} alt="" style={base} onError={() => setFailed(true)} loading="lazy" />;
  }

  return (
    <div
      style={{
        ...base,
        background: 'linear-gradient(155deg, #3a9568, #1f5e3f)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      {/* soft leaf texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 40%)',
      }} />
      <span style={{ fontSize: Math.min(64, height * 0.45), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
        {meta.emoji}
      </span>
    </div>
  );
}
