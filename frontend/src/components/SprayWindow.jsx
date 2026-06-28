import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { getSprayAdvice } from '../utils/weather.js';

const ADVICE = {
  rain_soon: { key: 'spray_rain_soon', icon: '🌧️', cls: 'var(--warn)' },
  hot_now: { key: 'spray_hot_now', icon: '☀️', cls: 'var(--warn)' },
  good_now: { key: 'spray_good_now', icon: '✅', cls: 'var(--green)' },
  ok_later: { key: 'spray_ok_later', icon: '🕓', cls: 'var(--green)' },
};

/**
 * "Best time to spray" card shown after a live diagnosis. Pulls a free,
 * key-less forecast from Open-Meteo for the farmer's region; falls back to
 * static general guidance when offline or the request fails.
 */
export default function SprayWindow({ region }) {
  const { t } = useLang();
  const [verdict, setVerdict] = useState('loading');

  useEffect(() => {
    if (!region) return;
    let alive = true;
    getSprayAdvice(region).then((v) => { if (alive) setVerdict(v); });
    return () => { alive = false; };
  }, [region]);

  if (!region || verdict === null) return null;

  const advice = verdict === 'loading' ? null : ADVICE[verdict];
  const textKey = advice ? advice.key : 'spray_offline';
  const icon = advice ? advice.icon : '🕓';
  const color = advice ? advice.cls : 'var(--ink-soft)';

  return (
    <div className="card" style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 24 }}>{verdict === 'loading' ? '⏳' : icon}</span>
      <div>
        <strong style={{ fontFamily: 'var(--font-display)', display: 'block', color }}>{t('spray_title')}</strong>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
          {verdict === 'loading' ? '…' : t(textKey)}
        </p>
      </div>
    </div>
  );
}
