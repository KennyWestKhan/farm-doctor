import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { getQuestionsForCrop } from '../data/diseaseDatabase';
import { ANSWER } from '../engine/symptomMatcher';
import { Header } from '../components/Chrome.jsx';

export default function SymptomChecklist({ cropId, onDone, onBack }) {
  const { t, pick } = useLang();
  const questions = getQuestionsForCrop(cropId);
  const [answers, setAnswers] = useState({});

  const setAnswer = (key, val) => setAnswers((a) => ({ ...a, [key]: val }));
  // Enable once every question has an answer — "Not sure"/"No" throughout is a
  // valid response (it just yields a low-confidence result that defers to the
  // camera/Vision path), so requiring a "Yes" would wrongly trap the user.
  const allAnswered = questions.every((q) => answers[q.key] != null);

  const OPTIONS = [
    { val: ANSWER.YES, label: t('yes'), cls: 'pill--green' },
    { val: ANSWER.NO, label: t('no'), cls: 'pill--bad' },
    { val: ANSWER.UNSURE, label: t('unsure'), cls: 'pill--warn' },
  ];

  return (
    <div className="screen page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      <Header title={t('symptoms_title')} onBack={onBack} />
      <p className="muted" style={{ marginTop: 0 }}>{t('symptoms_help')}</p>

      <div className="stagger stack" style={{ marginTop: 6 }}>
        {questions.map((q) => (
          <div key={q.key} className="card">
            <strong style={{ fontSize: 17, display: 'block', marginBottom: 12 }}>{pick(q)}</strong>
            <div className="row" style={{ gap: 8 }}>
              {OPTIONS.map((opt) => {
                const active = answers[q.key] === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => setAnswer(q.key, opt.val)}
                    className={`pill ${opt.cls}`}
                    style={{
                      flex: 1, justifyContent: 'center', minHeight: 48, fontSize: 15,
                      border: active ? '2.5px solid var(--ink)' : '2.5px solid transparent',
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

      <div className="sticky-cta" style={{ marginTop: 18 }}>
        <button className="btn btn--block" onClick={() => onDone(answers)} disabled={!allAnswered}>
          {t('see_result')} →
        </button>
      </div>
    </div>
  );
}
