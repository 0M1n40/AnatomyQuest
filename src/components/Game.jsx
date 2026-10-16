import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useGameEngine } from '../hooks/useGameEngine.js';
import { PHRASES, pick } from '../lib/phrases.js';
import { Button, Card, Feedback, MascotTalk, Spinner, Tag, optionClass } from './ui.jsx';
import GameHud from './GameHud.jsx';

const LETTERS = 'ABCD';

export default function Game({ player, mode, onFinish, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [hidden, setHidden] = useState([]);
  const [hint, setHint] = useState('');
  const [power, setPower] = useState({ fifty: true, hint: true });
  const busy = useRef(false);
  const answerRef = useRef(null);

  const engine = useGameEngine({ unlimitedLives: mode === 'review', onTimeout: () => answerRef.current?.(-1) });
  const { answered, register, resetTurn, setRunning, lives, combo } = engine;

  useEffect(() => {
    api.quiz(player.name, mode)
      .then((d) => {
        if (!d.questions.length) return setError('Nenhuma questão disponível.');
        setQuestions(d.questions);
        setRunning(true);
      })
      .catch((e) => setError(e.message));
  }, [player.name, mode, setRunning]);

  const q = questions?.[idx];

  const answer = useCallback(async (optionId) => {
    if (!q || answered || busy.current) return;
    busy.current = true;
    try {
      const r = await api.answer(player.name, q.id, optionId);
      setChosen(optionId);
      setResult(r);
      register(r.correct, { text: q.text, answer: r.answerText });
    } catch (e) {
      setError(e.message);
    } finally {
      busy.current = false;
    }
  }, [q, answered, player.name, register]);
  answerRef.current = answer;

  const isLast = questions && (idx + 1 >= questions.length || lives <= 0);

  const next = useCallback(() => {
    if (!answered) return;
    if (isLast) {
      onFinish({ mode, points: engine.points, hits: engine.hits, total: engine.log.length, maxCombo: engine.maxCombo, log: engine.log, outOfLives: lives <= 0 });
      return;
    }
    setIdx((i) => i + 1);
    setResult(null); setChosen(null); setHidden([]); setHint('');
    resetTurn();
  }, [answered, isLast, onFinish, mode, engine, lives, resetTurn]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const k = 'abcd'.indexOf(e.key.toLowerCase());
      if (k >= 0 && q?.options[k] && !answered && !hidden.includes(q.options[k].id)) answer(q.options[k].id);
      if (e.key === 'Enter') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answered, hidden, answer, next]);

  const speech = useMemo(() => {
    if (!answered) return pick(PHRASES.think);
    if (result?.correct) return combo >= 3 ? pick(PHRASES.combo(combo)) : pick(PHRASES.correct);
    return chosen === -1 ? pick(PHRASES.timeout) : pick(PHRASES.wrong);
  }, [answered, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const useFifty = async () => {
    setPower((p) => ({ ...p, fifty: false }));
    const { remove } = await api.fifty(q.id);
    setHidden(remove);
  };
  const useHint = async () => {
    setPower((p) => ({ ...p, hint: false }));
    const { hint } = await api.hint(q.id);
    setHint(hint);
  };

  if (error) return <Card className="text-center"><p className="mb-4 font-semibold text-accent">{error}</p><Button onClick={onExit}>Voltar</Button></Card>;
  if (!questions) return <Spinner label="Montando seu simulado…" />;

  const stateOf = (o) => {
    if (!answered) return hidden.includes(o.id) ? 'hidden' : 'idle';
    if (o.id === result.answerId) return 'correct';
    if (o.id === chosen) return 'wrong';
    return 'dim';
  };
  const mood = !answered ? 'think' : result.correct ? 'party' : 'sad';

  return (
    <div className="space-y-4">
      <GameHud engine={engine} idx={idx} total={questions.length} onExit={onExit} />

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <Card className={engine.anim} key={q.id}>
          <Tag>{q.system.icon} {q.system.name}</Tag>
          <h2 className="mb-5 mt-3 text-xl font-bold leading-relaxed">{q.text}</h2>

          <div className="space-y-2.5">
            {q.options.map((o, i) => (
              <button
                key={o.id}
                disabled={answered}
                onClick={() => answer(o.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(stateOf(o))}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card font-black text-brand shadow-sm">{LETTERS[i]}</span>
                {o.text}
              </button>
            ))}
          </div>

          {hint && !answered && (
            <div className="mt-4 rounded-2xl border-l-4 border-gold bg-gold/10 p-3">💡 <b>Dica:</b> {hint}</div>
          )}
          {answered && <Feedback result={result} timeout={chosen === -1}>{result.explanation}</Feedback>}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={!power.fifty || answered} onClick={useFifty}>✂️ 50/50</Button>
              <Button variant="secondary" size="sm" disabled={!power.hint || answered} onClick={useHint}>💡 Dica</Button>
            </div>
            {answered && <Button onClick={next}>{isLast ? 'Ver resultado 🏁' : 'Próxima ➜'}</Button>}
          </div>
        </Card>

        <div className="order-first lg:order-none">
          <MascotTalk mood={mood} size={100} text={speech} className="lg:sticky lg:top-20 lg:flex-col-reverse lg:items-center" />
        </div>
      </div>
    </div>
  );
}
