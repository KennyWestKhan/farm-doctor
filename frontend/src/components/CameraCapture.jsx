import { useRef, useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';

/**
 * In-app camera with a framing reticle — a PROTOTYPE for A/B-ing photo quality
 * against the phone's native camera on a real device.
 *
 * Why this exists: the default capture path is <input capture>, which hands off
 * to the OS camera and lets us draw NOTHING on top. To guide framing ("fit the
 * sick leaf in the box, fill the frame") we need our own getUserMedia stream +
 * overlay + canvas grab. The tradeoff to watch: a raw stream on a cheap old
 * Android can be lower-res / worse-focused than the native camera app, which
 * would hurt diagnosis — hence the side-by-side "use my phone camera" escape
 * hatch, which is also the automatic fallback when getUserMedia isn't available
 * (denied, no camera, insecure context, old WebView).
 *
 * Props:
 *  - onCapture(blob): a JPEG Blob of the framed frame (same shape the flow's
 *    file input produces, so downstream code is unchanged)
 *  - onCancel(): user backed out
 *  - onFallback(): user (or an error) chose the native OS camera instead
 */
export default function CameraCapture({ onCapture, onCancel, onFallback }) {
  const { t } = useLang();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | live | denied | unavailable

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Secure context + API required; localhost counts as secure in dev.
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
        setStatus('unavailable');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // rear camera for crops
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus('live');
      } catch (err) {
        setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const w = video?.videoWidth || 0;
    const h = video?.videoHeight || 0;
    if (!w || !h) return; // stream not ready yet
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onCapture(blob);
      },
      'image/jpeg',
      0.92,
    );
  }

  // ---- error / unavailable: offer the native camera (the real fallback) ----
  if (status === 'denied' || status === 'unavailable') {
    return (
      <div style={overlay}>
        <div className="stack center" style={{ padding: 24, maxWidth: 340 }}>
          <div style={{ fontSize: 52 }}>📷</div>
          <p style={{ color: '#fff', margin: 0 }}>
            {status === 'denied' ? t('camera_denied') : t('camera_unavailable')}
          </p>
          <button className="btn btn--block" onClick={onFallback} style={{ marginTop: 8 }}>
            {t('camera_use_phone')}
          </button>
          <button className="btn btn--tint btn--block" onClick={onCancel}>{t('back')}</button>
        </div>
      </div>
    );
  }

  // ---- live camera with framing reticle ----
  return (
    <div style={overlay}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Framing reticle: a centred box whose huge outer shadow darkens
          everything outside it, so the eye goes to what to fill. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div
          style={{
            width: '78vw', maxWidth: 360, aspectRatio: '1 / 1',
            border: '3px solid rgba(255,255,255,0.9)', borderRadius: 24,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
          }}
        />
      </div>

      {/* Guidance text */}
      <div style={{ position: 'absolute', top: 'calc(24px + env(safe-area-inset-top))', left: 16, right: 16, textAlign: 'center' }}>
        <span
          style={{
            display: 'inline-block', background: 'rgba(0,0,0,0.55)', color: '#fff',
            padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          {t('camera_hint')}
        </span>
      </div>

      {/* Cancel */}
      <button
        onClick={() => { stopStream(); onCancel(); }}
        aria-label={t('back')}
        style={{
          position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 16,
          width: 44, height: 44, borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 22,
        }}
      >
        ✕
      </button>

      {/* Capture + native-camera escape hatch */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <button
          onClick={capture}
          aria-label={t('take_photo')}
          disabled={status !== 'live'}
          style={{
            width: 74, height: 74, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.85)',
            background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        />
        <button
          onClick={() => { stopStream(); onFallback(); }}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', textDecoration: 'underline' }}
        >
          {t('camera_use_phone')}
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 60, background: '#000',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
