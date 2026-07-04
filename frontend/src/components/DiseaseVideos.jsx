import { useLang } from '../i18n.jsx';
import YouTubeButton from './YouTubeButton.jsx';

/**
 * "Watch & learn" videos for a disease.
 *
 * - If the disease has curated YouTube IDs (disease.videos), embed them
 *   (privacy-friendly youtube-nocookie, lazy, responsive 16:9).
 * - Always offer a "Find videos on YouTube" button that opens a real search for
 *   the disease — reliable and always relevant even where nothing is curated.
 *
 * We never hardcode unverified IDs (a bad ID renders as a broken player); the
 * search button is the universal fallback.
 */
export default function DiseaseVideos({ disease }) {
  const { t, pick } = useLang();
  if (!disease) return null;

  const cropName = pick(disease.cropName) || '';
  const query = `${disease.name.en} ${cropName} disease treatment`.trim();
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const ids = disease.videos || [];

  return (
    <div className="card stack">
      <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>▶️ {t('videos_title')}</strong>
      <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t('videos_hint')}</p>

      {ids.map((id) => (
        <div key={id} style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Disease video"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      ))}

      <YouTubeButton href={searchUrl} label={t('videos_search')} />
    </div>
  );
}
