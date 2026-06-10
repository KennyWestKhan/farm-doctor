import { useLang } from '../i18n.jsx';
import { CROPS } from '../data/diseaseDatabase';
import { CropArt } from '../components/CropArt.jsx';
import { BackButton } from '../components/Chrome.jsx';

// A warm tint per crop so the grid reads as four distinct "plots".
const TINT = {
  chilli_pepper: 'rgba(192,67,43,0.10)',
  cassava: 'rgba(47,125,58,0.10)',
  sweet_potato: 'rgba(201,126,10,0.12)',
  groundnut: 'rgba(242,169,22,0.14)',
};

export default function CropSelect({ onPick, onBack }) {
  const { t, pick } = useLang();
  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <div>
        <h2>{t('choose_crop')}</h2>
        <div className="kente-rule" style={{ width: 80, margin: '12px 0 4px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
        {CROPS.map((crop) => (
          <button
            key={crop.id}
            className="card"
            onClick={() => onPick(crop.id)}
            style={{
              textAlign: 'center',
              minHeight: 168,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0) 45%), ${TINT[crop.id]}, #fff`,
            }}
          >
            <CropArt cropId={crop.id} size={84} />
            <strong style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>
              {pick(crop.name)}
            </strong>
          </button>
        ))}
      </div>
    </div>
  );
}
