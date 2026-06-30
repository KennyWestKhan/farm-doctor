import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n.jsx';
import { Header } from '../components/Chrome.jsx';
import ScanLoading from '../components/ScanLoading.jsx';
import { useOnline } from '../components/useOnline';
import { CROPS } from '../data/diseaseDatabase';
import { checkPesticideStatus } from '../data/pesticideRegistry.js';
import { sanitizeText, LIMITS } from '../utils/sanitize';
import { apiFetch } from '../utils/apiFetch.js';

const API = import.meta.env.VITE_API_URL || '';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Scan-a-label flow: photograph a chemical container → backend OCRs (Textract)
 * and translates (Claude function calling) into local-analogy instructions →
 * farmer can refine with context chips. Online-only.
 */
export default function ScanLabel() {
  const { t, pick, lang } = useLang();
  const nav = useNavigate();
  const online = useOnline();
  const inputRef = useRef(null);

  const [step, setStep] = useState('intro'); // intro | loading | result | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [lastFile, setLastFile] = useState(null);
  const [refining, setRefining] = useState(false);
  const [ctx, setCtx] = useState({ farmSize: '', crop: '', growthStage: '', note: '' });

  const canScan = online && API;

  async function callTranslate(body) {
    const res = await apiFetch('/api/translate-label', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const err = new Error('scan_limit');
      err.isLimit = true;
      throw err;
    }
    if (!res.ok) throw new Error(`status ${res.status}`);
    return res.json();
  }

  async function onPhoto(file) {
    if (!file) return;
    setLastFile(file);
    setStep('loading');
    setCanRetry(false);
    try {
      const imageBase64 = await fileToBase64(file);
      const data = await callTranslate({ imageBase64, mediaType: file.type || 'image/jpeg' });
      setResult(data);
      setStep('result');
    } catch (err) {
      // Distinguish *why* it failed so the farmer isn't just stuck on a spinner
      // with no explanation, and offer a one-tap retry without retaking the photo.
      if (err?.isLimit) {
        setErrorMsg(t('scan_limit_reached'));
        setCanRetry(false);
      } else if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        setErrorMsg(t('scan_timeout'));
        setCanRetry(true);
      } else if (!navigator.onLine) {
        setErrorMsg(t('scan_needs_internet'));
        setCanRetry(true);
      } else if (/^status 5/.test(err?.message || '')) {
        setErrorMsg(t('scan_server_error'));
        setCanRetry(true);
      } else {
        setErrorMsg(t('scan_network_error'));
        setCanRetry(true);
      }
      setStep('error');
    }
  }

  const retry = () => { if (lastFile) onPhoto(lastFile); };

  // Refine reuses the already-extracted rawText — no second OCR call.
  async function refine() {
    if (!result?.rawText) return;
    setRefining(true);
    try {
      const data = await callTranslate({ rawText: result.rawText, context: ctx });
      setResult(data);
    } catch {
      /* keep current result on a failed refine */
    } finally {
      setRefining(false);
    }
  }

  const reset = () => { setResult(null); setCtx({ farmSize: '', crop: '', growthStage: '', note: '' }); setLastFile(null); setCanRetry(false); setStep('intro'); };

  // ---- intro / capture ----
  if (step === 'intro' || step === 'error') {
    return (
      <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
        <Header title={t('scan_label_title')} onBack={() => nav(-1)} />
        <div className="stagger stack" style={{ marginTop: 6 }}>
          <div className="card center stack">
            <div style={{ fontSize: 52 }}>🏷️📷</div>
            <p className="muted" style={{ margin: 0 }}>{t('scan_subtitle')}</p>
          </div>
          {step === 'error' && (
            <div style={{ background: 'var(--bad-tint)', color: 'var(--bad)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {!canScan && (
            <div style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
              📶 {t('scan_needs_internet')}
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => onPhoto(e.target.files?.[0])} />

        <div className="sticky-cta" style={{ display: 'flex', gap: 10 }}>
          {step === 'error' && canRetry && (
            <button className="btn btn--tint" style={{ flex: 1 }} onClick={retry}>↻ {t('try_again')}</button>
          )}
          <button className="btn btn--block" style={{ flex: 1 }} disabled={!canScan} onClick={() => inputRef.current?.click()}>
            📷 {t('scan_cta')}
          </button>
        </div>
      </div>
    );
  }

  // ---- loading ----
  if (step === 'loading') {
    return (
      <div className="screen page-enter">
        <Header title={t('scan_label_title')} onBack={reset} />
        <ScanLoading
          icon="🔎"
          steps={[
            t('scan_step_uploading'),
            t('scan_label_step_ocr'),
            t('scan_label_step_translating'),
            t('scan_step_finalizing'),
          ]}
        />
      </div>
    );
  }

  // ---- result + refine ----
  const pesticideCheck = result && !result.unreadable
    ? checkPesticideStatus({ productName: result.product_name, activeIngredient: result.active_ingredient })
    : null;
  const instr = result?.instructions?.[lang] || result?.instructions?.en;
  const rows = instr ? [
    { icon: '🥣', label: t('how_to_mix'), text: instr.mixing },
    { icon: '🍶', label: t('how_much'), text: instr.amount },
    { icon: '💨', label: t('how_to_apply'), text: instr.application },
    { icon: '🔁', label: t('how_often'), text: instr.frequency },
    { icon: '🛡️', label: t('label_safety'), text: instr.safety },
  ] : [];

  return (
    <div className="screen page-enter">
      <Header title={t('scan_label_title')} onBack={reset} />
      <div className="stagger">
        <div className="card stack">
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{t('label_product')}</div>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{result.product_name || '—'}</strong>
            </div>
            {result.treats ? <span className="pill pill--green">{t('label_treats')}: {result.treats}</span> : null}
          </div>

          {result.unreadable && (
            <div style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14, fontWeight: 700 }}>
              ⚠️ {t('scan_unreadable')}
            </div>
          )}

          {pesticideCheck?.status === 'banned' && (
            <div className="stack" style={{ background: 'var(--bad-tint)', color: 'var(--bad)', borderRadius: 'var(--radius)', padding: 14 }}>
              <strong>🚫 {t('pesticide_banned_title')}</strong>
              <span style={{ fontWeight: 400, fontSize: 14 }}>{pick(pesticideCheck.reason)}</span>
            </div>
          )}
          {pesticideCheck?.status === 'registered' && (
            <div className="row" style={{ background: 'var(--green-tint)', color: 'var(--green-deep)', borderRadius: 'var(--radius)', padding: 14, gap: 8, fontWeight: 700 }}>
              ✅ {t('pesticide_registered_title')}
            </div>
          )}
          {pesticideCheck?.status === 'unknown' && (
            <div className="stack" style={{ background: 'var(--warn-tint)', color: 'var(--warn)', borderRadius: 'var(--radius)', padding: 14 }}>
              <strong>❓ {t('pesticide_unknown_title')}</strong>
              <span style={{ fontWeight: 400, fontSize: 14 }}>{t('pesticide_unknown_body')}</span>
            </div>
          )}
          {pesticideCheck && (
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>{t('pesticide_disclaimer')}</p>
          )}

          {rows.map((r) => (
            <div key={r.label} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24 }}>{r.icon}</span>
              <div>
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{r.label}</div>
                <div style={{ fontSize: 16 }}>{r.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic context refine */}
        <div className="card stack" style={{ marginTop: 14 }}>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>⚙️ {t('refine_title')}</strong>

          <ChipRow label={t('refine_farm_size')} value={ctx.farmSize} onPick={(v) => setCtx((c) => ({ ...c, farmSize: v }))}
            options={[['small', t('farm_small')], ['medium', t('farm_medium')], ['large', t('farm_large')]]} />

          <ChipRow label={t('refine_stage')} value={ctx.growthStage} onPick={(v) => setCtx((c) => ({ ...c, growthStage: v }))}
            options={[['seedling', t('stage_seedling')], ['flowering', t('stage_flowering')], ['fruiting', t('stage_fruiting')]]} />

          <ChipRow label={t('refine_crop')} value={ctx.crop} onPick={(v) => setCtx((c) => ({ ...c, crop: v }))}
            options={CROPS.map((c) => [c.id, pick(c.name)])} />

          <input
            placeholder={t('refine_other')}
            value={ctx.note}
            maxLength={LIMITS.note}
            onChange={(e) => setCtx((c) => ({ ...c, note: sanitizeText(e.target.value, LIMITS.note) }))}
            style={{ padding: 14, fontSize: 16, fontFamily: 'var(--font-body)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', outline: 'none' }}
          />

          <button className="btn btn--block" onClick={refine} disabled={refining}>
            {refining ? '…' : `↻ ${t('refine_update')}`}
          </button>
        </div>

        <button className="btn btn--tint btn--block" onClick={reset} style={{ marginTop: 14 }}>📷 {t('scan_again')}</button>
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onPick }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div className="scroll-x">
        {options.map(([val, text]) => {
          const active = value === val;
          return (
            <button key={val} className="pill" onClick={() => onPick(active ? '' : val)}
              style={{
                whiteSpace: 'nowrap', minHeight: 40, padding: '8px 16px', border: 'none',
                background: active ? 'var(--green)' : 'var(--green-tint)',
                color: active ? '#fff' : 'var(--green-deep)',
              }}>
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
