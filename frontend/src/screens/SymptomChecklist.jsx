import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { getQuestionsForCrop } from '../data/diseaseDatabase';
import { ANSWER } from '../engine/symptomMatcher';
import { BackButton } from '../components/Chrome.jsx';

export default function SymptomChecklist({ cropId, onDone, onBack }) {
  const { t, pick } = useLang();
  const questions = getQuestionsForCrop(cropId);
  const [answers, setAnswers] = useState({});

  const setAnswer = (key, val) => setAnswers((a) => ({ ...a, [key]: val }));

  // Require at least one YES so the matcher has something to score.
  const hasSignal = Object.values(answers).some((v) => v === ANSWER.YES);

  const OPTIONS = [
    { val: ANSWER.YES, label: t('yes'), cls: 'pill--ok' },
    { val: ANSWER.NO, label: t('no'), cls: 'pill--bad' },
    { val: ANSWER.UNSURE, label: t('unsure'), cls: 'pill--soil' },
  ];

  return (
    <div className="screen">
      <BackButton onClick={onBack} />
      <div>
        <h2>{t('symptoms_title')}</h2>
        <div className="kente-rule" style={{ width: 80, margin: '12px 0 8px' }} />
        <p className="muted" style={{ marginTop: 4 }}>{t('symptoms_help')}</p>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        {questions.map((q) => (
          <div key={q.key} className="card">
            <strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
              {pick(q)}
            </strong>
            <div className="row" style={{ gap: 8 }}>
              {OPTIONS.map((opt) => {
                const active = answers[q.key] === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => setAnswer(q.key, opt.val)}
                    className={`pill ${opt.cls}`}
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      minHeight: 52,
                      fontSize: 16,
                      border: active ? '3px solid var(--ink)' : '3px solid transparent',
                      opacity: !answers[q.key] || active ? 1 : 0.5,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn"
        onClick={() => onDone(answers)}
        disabled={!hasSignal}
        style={{ marginTop: 20 }}
      >
        {t('see_result')} →
      </button>
    </div>
  );
}
