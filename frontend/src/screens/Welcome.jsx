import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { LangToggle } from '../components/Chrome.jsx';
import logoSrc from '/icons/icon-192.png';

const STEPS = { choice: 0, phone: 1, otp: 2 };

function formatGhanaPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return '+' + digits;
  const rest = digits.slice(3, 12);
  const parts = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5)].filter(Boolean);
  return '+' + digits.slice(0, 3) + ' ' + parts.join(' ');
}

function isValidGhanaPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('233');
}

export default function Welcome() {
  const { t } = useLang();
  const { continueAsGuest, sendOtp, verifyOtp, markWelcomed } = useAuth();
  const [step, setStep] = useState(STEPS.choice);
  const [phone, setPhone] = useState('+233');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSendOtp = async () => {
    setError('');
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (!isValidGhanaPhone(cleaned)) {
      setError(t('welcome_phone_invalid'));
      return;
    }
    setBusy(true);
    const { error: err } = await sendOtp(cleaned);
    setBusy(false);
    if (err) {
      setError(err.message);
    } else {
      setStep(STEPS.otp);
    }
  };

  const handleVerify = async () => {
    setError('');
    if (code.length < 4) {
      setError(t('welcome_code_invalid'));
      return;
    }
    setBusy(true);
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const { error: err } = await verifyOtp(cleaned, code);
    setBusy(false);
    if (err) {
      setError(err.message);
    }
  };

  // Choice screen
  if (step === STEPS.choice) {
    return (
      <div className="screen page-enter" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 0, minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 18 }}>
          <LangToggle />
        </div>

        <div style={{ marginBottom: 32 }}>
          <img src={logoSrc} alt="" width={80} height={80} style={{ borderRadius: 20, marginBottom: 12 }} />
          <h1 style={{ marginBottom: 6 }}>{t('app_name')}</h1>
          <p className="muted" style={{ fontSize: 16, maxWidth: 280, margin: '0 auto' }}>{t('tagline')}</p>
        </div>

        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button className="btn" onClick={() => setStep(STEPS.phone)}>
            📱 {t('welcome_sign_in')}
          </button>
          <button className="btn btn--ghost" onClick={continueAsGuest}>
            {t('welcome_guest')}
          </button>
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 28, maxWidth: 300 }}>
          {t('welcome_guest_note')}
        </p>
      </div>
    );
  }

  // Phone number entry
  if (step === STEPS.phone) {
    return (
      <div className="screen page-enter" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 0, minHeight: '100vh', background: 'var(--bg)' }}>
        <button
          className="icon-btn"
          onClick={() => { setStep(STEPS.choice); setError(''); }}
          aria-label="Back"
          style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 18 }}
        >
          ←
        </button>

        <div style={{ marginBottom: 28 }}>
          <img src={logoSrc} alt="" width={56} height={56} style={{ borderRadius: 14, marginBottom: 10 }} />
          <h2>{t('welcome_phone_title')}</h2>
          <p className="muted" style={{ fontSize: 15, maxWidth: 300, margin: '6px auto 0' }}>
            {t('welcome_phone_desc')}
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9+]/g, '');
              if (!raw.startsWith('+233') && !'+233'.startsWith(raw)) return;
              const digits = raw.replace(/\D/g, '');
              if (digits.length > 12) return;
              setPhone(formatGhanaPhone(raw));
            }}
            placeholder="+233 50 123 4567"
            style={{
              width: '100%', padding: '16px 18px', fontSize: 20, fontWeight: 700,
              fontFamily: 'var(--font-display)', borderRadius: 'var(--radius)',
              border: `2px solid ${error ? 'var(--bad)' : 'var(--line)'}`,
              background: 'var(--card)', textAlign: 'center', outline: 'none',
            }}
          />
          {error && <p style={{ color: 'var(--bad)', fontSize: 14, margin: 0 }}>{error}</p>}
          <button className="btn" onClick={handleSendOtp} disabled={busy}>
            {busy ? '...' : t('welcome_send_code')}
          </button>
        </div>

        <button
          onClick={() => { continueAsGuest(); }}
          style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 15, marginTop: 24, textDecoration: 'underline' }}
        >
          {t('welcome_skip')}
        </button>
      </div>
    );
  }

  // OTP verification
  return (
    <div className="screen page-enter" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 0, minHeight: '100vh', background: 'var(--bg)' }}>
      <button
        className="icon-btn"
        onClick={() => { setStep(STEPS.phone); setError(''); setCode(''); }}
        aria-label="Back"
        style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 18 }}
      >
        ←
      </button>

      <div style={{ marginBottom: 28 }}>
        <img src={logoSrc} alt="" width={56} height={56} style={{ borderRadius: 14, marginBottom: 10 }} />
        <h2>{t('welcome_verify_title')}</h2>
        <p className="muted" style={{ fontSize: 15, maxWidth: 300, margin: '6px auto 0' }}>
          {t('welcome_verify_desc')} <strong>{phone}</strong>
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          style={{
            width: '100%', padding: '16px 18px', fontSize: 28, fontWeight: 800,
            fontFamily: 'var(--font-display)', borderRadius: 'var(--radius)',
            border: `2px solid ${error ? 'var(--bad)' : 'var(--line)'}`,
            background: 'var(--card)', textAlign: 'center', outline: 'none',
            letterSpacing: '0.3em',
          }}
        />
        {error && <p style={{ color: 'var(--bad)', fontSize: 14, margin: 0 }}>{error}</p>}
        <button className="btn" onClick={handleVerify} disabled={busy}>
          {busy ? '...' : t('welcome_verify_btn')}
        </button>
      </div>

      <button
        onClick={() => { setError(''); handleSendOtp(); }}
        disabled={busy}
        style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 15, marginTop: 20, textDecoration: 'underline' }}
      >
        {t('welcome_resend')}
      </button>
    </div>
  );
}
