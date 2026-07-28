import { useLang } from '../i18n.jsx';
import { CROPS } from '../data/diseaseDatabase';
import CropPhoto from '../components/CropPhoto.jsx';
import { Header } from '../components/Chrome.jsx';

/**
 * @param {object} props
 * @param {(cropId: string) => void} props.onPick
 * @param {() => void} [props.onBack]
 * @param {() => void} [props.onUnsure]  — scan flow: "Not sure, detect from photo"
 */
export default function CropSelect({ onPick, onBack, onUnsure }) {
  const { t, pick } = useLang();
  return (
    <div className="screen page-enter">
      <Header title={t('choose_crop')} onBack={onBack} />
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
        {CROPS.map((crop) => (
          <button key={crop.id} className="card" onClick={() => onPick(crop.id)} style={{ padding: 10 }}>
            <CropPhoto cropId={crop.id} height={120} radius="var(--radius)" />
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17, display: 'block', marginTop: 10, marginLeft: 4 }}>
              {pick(crop.name)}
            </strong>
          </button>
        ))}
      </div>
      {onUnsure && (
        <button
          className="btn btn--tint btn--block"
          onClick={onUnsure}
          style={{ marginTop: 16 }}
        >
          {t('scan_crop_unsure')}
        </button>
      )}
    </div>
  );
}
