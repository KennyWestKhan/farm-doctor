import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';

const STEP_INTERVAL_MS = 2200;
const SLOW_AFTER_S = 8;

/**
 * Loading state for the crop/label scan pipelines. A single network call can
 * take several seconds (OCR + Claude, or Vision alone on a slow connection),
 * and a single static "Looking at your crop…" message left farmers staring
 * at a frozen screen with no idea whether it was still working. This cycles
 * through the actual pipeline stages and adds a reassurance note if it runs
 * long, so the wait reads as progress instead of a hang.
 *
 * `steps` is an array of translated strings, shown one at a time.
 */
export default function ScanLoading({ icon = '🔎', steps }) {
  const { t } = useLang();
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsedS, setElapsedS] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, STEP_INTERVAL_MS);
    const clock = setInterval(() => setElapsedS((s) => s + 1), 1000);
    return () => { clearInterval(stepTimer); clearInterval(clock); };
  }, [steps.length]);

  // Progress bar creeps toward 92% as steps advance, never claiming "done".
  const pct = Math.min(92, 20 + stepIdx * (72 / Math.max(1, steps.length - 1)));

  return (
    <div className="card center stack" style={{ marginTop: 40 }}>
      <div className="pop" style={{ fontSize: 48 }}>{icon}</div>
      <strong style={{ fontFamily: 'var(--font-display)' }}>{steps[stepIdx]}</strong>
      <div className="meter" style={{ width: '100%' }}><span style={{ '--to': `${pct}%` }} /></div>
      {elapsedS >= SLOW_AFTER_S && (
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t('scan_slow_notice')}</p>
      )}
    </div>
  );
}
