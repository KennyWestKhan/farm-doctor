import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../i18n.jsx";
import { useAuth } from "../auth/useAuth.js";
import { LangToggle } from "../components/Chrome.jsx";
import { formatGhanaPhone, isValidGhanaPhone } from "../utils/phoneValidation.js";
import logoSrc from "/icons/icon-192.png";

const STEPS = { choice: 0, phone: 1, otp: 2 };

/** Google's 4-colour "G" mark, inlined so the button needs no asset. */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Welcome() {
  const { t } = useLang();
  const { getStarted, signInWithGoogle, authConfigured, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.choice);
  const [phone, setPhone] = useState("+233");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setBusy(true);
    // On success this redirects away, so we won't return here; only reset on error.
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    const cleaned = phone.replace(/[^0-9+]/g, "");
    if (!isValidGhanaPhone(cleaned)) {
      setError(t("welcome_phone_invalid"));
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
    setError("");
    if (code.length < 4) {
      setError(t("welcome_code_invalid"));
      return;
    }
    setBusy(true);
    const cleaned = phone.replace(/[^0-9+]/g, "");
    const { error: err } = await verifyOtp(cleaned, code);
    setBusy(false);
    if (err) {
      setError(err.message);
    } else {
      navigate("/", { replace: true });
    }
  };

  // Choice screen
  if (step === STEPS.choice) {
    return (
      <div
        className="screen page-enter"
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 0,
          minHeight: "100vh",
          background: "var(--bg)"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "calc(16px + env(safe-area-inset-top))",
            right: 18
          }}
        >
          <LangToggle />
        </div>

        <div style={{ marginBottom: 32 }}>
          <img
            src={logoSrc}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: 20, marginBottom: 12 }}
          />
          <h1 style={{ marginBottom: 6 }}>{t("app_name")}</h1>
          <p
            className="muted"
            style={{ fontSize: 16, maxWidth: 280, margin: "0 auto" }}
          >
            {t("tagline")}
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 340,
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          <button className="btn" onClick={getStarted}>
            {t("welcome_get_started")}
          </button>
          {authConfigured && (
            <button className="btn btn--ghost" onClick={handleGoogle} disabled={busy} style={{ gap: 10 }}>
              <GoogleIcon />
              {t("welcome_google")}
            </button>
          )}
          {error && (
            <p style={{ color: "var(--bad)", fontSize: 14, margin: 0 }}>{error}</p>
          )}
        </div>

        {authConfigured && (
          <button
            onClick={() => { setStep(STEPS.phone); setError(""); }}
            style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 15, marginTop: 22, textDecoration: "underline" }}
          >
            📱 {t("welcome_use_phone")}
          </button>
        )}

        <p
          className="muted"
          style={{ fontSize: 13, marginTop: 22, maxWidth: 300 }}
        >
          {t("welcome_start_note")}
        </p>
        <p className="muted" style={{ fontSize: 11, marginTop: 12, maxWidth: 300, opacity: 0.7 }}>
          {t('welcome_privacy')}
        </p>
      </div>
    );
  }

  // Phone number entry
  if (step === STEPS.phone) {
    return (
      <div
        className="screen page-enter"
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 0,
          minHeight: "100vh",
          background: "var(--bg)"
        }}
      >
        <button
          className="icon-btn"
          onClick={() => {
            setStep(STEPS.choice);
            setError("");
          }}
          aria-label="Back"
          style={{
            position: "absolute",
            top: "calc(16px + env(safe-area-inset-top))",
            left: 18
          }}
        >
          ←
        </button>

        <div style={{ marginBottom: 28 }}>
          <img
            src={logoSrc}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: 14, marginBottom: 10 }}
          />
          <h2>{t("welcome_phone_title")}</h2>
          <p
            className="muted"
            style={{ fontSize: 15, maxWidth: 300, margin: "6px auto 0" }}
          >
            {t("welcome_phone_desc")}
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 340,
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9+]/g, "");
              if (!raw.startsWith("+233") && !"+233".startsWith(raw)) return;
              const digits = raw.replace(/\D/g, "");
              if (digits.length > 12) return;
              setPhone(formatGhanaPhone(raw));
            }}
            placeholder="+233 50 123 4567"
            style={{
              width: "100%",
              padding: "16px 18px",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              borderRadius: "var(--radius)",
              border: `2px solid ${error ? "var(--bad)" : "var(--line)"}`,
              background: "var(--card)",
              textAlign: "center",
              outline: "none"
            }}
          />
          {error && (
            <p style={{ color: "var(--bad)", fontSize: 14, margin: 0 }}>
              {error}
            </p>
          )}
          <button className="btn" onClick={handleSendOtp} disabled={busy}>
            {busy ? "..." : t("welcome_send_code")}
          </button>
        </div>

        <button
          onClick={getStarted}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-soft)",
            fontSize: 15,
            marginTop: 24,
            textDecoration: "underline"
          }}
        >
          {t("welcome_skip")}
        </button>
      </div>
    );
  }

  // OTP verification
  return (
    <div
      className="screen page-enter"
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 0,
        minHeight: "100vh",
        background: "var(--bg)"
      }}
    >
      <button
        className="icon-btn"
        onClick={() => {
          setStep(STEPS.phone);
          setError("");
          setCode("");
        }}
        aria-label="Back"
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top))",
          left: 18
        }}
      >
        ←
      </button>

      <div style={{ marginBottom: 28 }}>
        <img
          src={logoSrc}
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: 14, marginBottom: 10 }}
        />
        <h2>{t("welcome_verify_title")}</h2>
        <p
          className="muted"
          style={{ fontSize: 15, maxWidth: 300, margin: "6px auto 0" }}
        >
          {t("welcome_verify_desc")} <strong>{phone}</strong>
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          style={{
            width: "100%",
            padding: "16px 18px",
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "var(--font-display)",
            borderRadius: "var(--radius)",
            border: `2px solid ${error ? "var(--bad)" : "var(--line)"}`,
            background: "var(--card)",
            textAlign: "center",
            outline: "none",
            letterSpacing: "0.3em"
          }}
        />
        {error && (
          <p style={{ color: "var(--bad)", fontSize: 14, margin: 0 }}>
            {error}
          </p>
        )}
        <button className="btn" onClick={handleVerify} disabled={busy}>
          {busy ? "..." : t("welcome_verify_btn")}
        </button>
      </div>

      <button
        onClick={() => {
          setError("");
          handleSendOtp();
        }}
        disabled={busy}
        style={{
          background: "none",
          border: "none",
          color: "var(--green)",
          fontSize: 15,
          marginTop: 20,
          textDecoration: "underline"
        }}
      >
        {t("welcome_resend")}
      </button>
    </div>
  );
}
