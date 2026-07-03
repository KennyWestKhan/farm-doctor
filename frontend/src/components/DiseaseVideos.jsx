import { useLang } from '../i18n.jsx';

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

      {/* YouTube identity lives in the red play icon, not the whole button —
          a full #FF0000 fill read as a danger action in this green UI. */}
      <a className="btn btn--block" href={searchUrl} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: 'none', background: '#fdecea', color: '#b3261e', boxShadow: 'none' }}>
        <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
          <rect width="26" height="18" rx="4.5" fill="#FF0000" />
          <path d="M10.4 4.9v8.2l7.2-4.1z" fill="#fff" />
        </svg>
        {t('videos_search')}
      </a>
    </div>
  );
}
