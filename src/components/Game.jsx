import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { TIME, useGameEngine } from '../hooks/useGameEngine.js';
import { PHRASES, pick } from '../lib/phrases.js';
import { Button, Card, Feedback, MascotTalk, Spinner, Tag, optionClass } from './ui.jsx';
import GameHud from './GameHud.jsx';
import OpenQuestion from './OpenQuestion.jsx';

const LETTERS = 'ABCD';

export default function Game({ player, mode, onFinish, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  // objetivas
  const [result, setResult] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [hidden, setHidden] = useState([]);
  // discursivas
  const [text, setText] = useState('');
  const [review, setReview] = useState(null);
  const [graded, setGraded] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  // ajudas
  const [hint, setHint] = useState('');
  const [power, setPower] = useState({ fifty: true, hint: true });
  const busy = useRef(false);
  const timeoutRef = useRef(null);

  const engine = useGameEngine({ unlimitedLives: mode === 'review' || mode === 'open', onTimeout: () => timeoutRef.current?.() });
  const { register, start, pause, lives, combo } = engine;

  useEffect(() => {
    api.quiz(player.name, mode)
      .then((d) => (d.questions.length ? setQuestions(d.questions) : setError('Nenhuma questão disponível.')))
      .catch((e) => setError(e.message));
  }, [player.name, mode]);

  const q = questions?.[idx];
  const isOpen = q?.type === 'open';
  const done = isOpen ? !!graded : engine.answered;

  // Cada questão começa com o tempo do seu tipo
  useEffect(() => { if (q) start(TIME[q.type] || TIME.mcq); }, [q, start]);

  const answer = useCallback(async (optionId) => {
    if (!q || isOpen || engine.answered || busy.current) return;
    busy.current = true;
    try {
      const r = await api.answer(player.name, q.id, optionId);
      setChosen(optionId);
      setResult(r);
      register(r.correct ? 'correct' : 'wrong', { text: q.text, answer: r.answerText });
    } catch (e) {
      setError(e.message);
    } finally {
      busy.current = false;
    }
  }, [q, isOpen, engine.answered, player.name, register]);

  const submitOpen = useCallback(async (value, byTimeout = false) => {
    if (!q || !isOpen || review) return;
    pause();
    setTimedOut(byTimeout);
    const r = await api.answerOpen(q.id, value);
    setReview({ ...r, answer: value.trim() });
  }, [q, isOpen, review, pause]);

  const gradeOpen = async (res) => {
    await api.gradeOpen(player.name, q.id, res);
    setGraded(res);
    register(res, { text: q.text, answer: 'Ver resposta modelo nos flashcards' });
  };

  timeoutRef.current = () => (isOpen ? submitOpen(text, true) : answer(-1));

  const isLast = questions && (idx + 1 >= questions.length || lives <= 0);

  const next = useCallback(() => {
    if (!done) return;
    if (isLast) {
      onFinish({ mode, points: engine.points, hits: engine.hits, total: engine.log.length, maxCombo: engine.maxCombo, log: engine.log, outOfLives: lives <= 0 });
      return;
    }
    setIdx((i) => i + 1);
    setResult(null); setChosen(null); setHidden([]); setHint('');
    setText(''); setReview(null); setGraded(null); setTimedOut(false);
  }, [done, isLast, onFinish, mode, engine, lives]);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = 'abcd'.indexOf(e.key.toLowerCase());
      if (!isOpen && k >= 0 && q?.options?.[k] && !engine.answered && !hidden.includes(q.options[k].id)) answer(q.options[k].id);
      if (e.key === 'Enter') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, isOpen, engine.answered, hidden, answer, next]);

  const speech = useMemo(() => {
    if (isOpen) {
      if (!review) return pick(PHRASES.write);
      if (!graded) return pick(PHRASES.review);
      return pick(PHRASES[graded === 'correct' ? 'correct' : graded === 'partial' ? 'partial' : 'wrong']);
    }
    if (!engine.answered) return pick(PHRASES.think);
    if (result?.correct) return combo >= 3 ? pick(PHRASES.combo(combo)) : pick(PHRASES.correct);
    return chosen === -1 ? pick(PHRASES.timeout) : pick(PHRASES.wrong);
  }, [idx, engine.answered, !!review, graded]); // eslint-disable-line react-hooks/exhaustive-deps

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
  if (!questions || !q) return <Spinner label="Montando seu simulado…" />;

  const stateOf = (o) => {
    if (!engine.answered) return hidden.includes(o.id) ? 'hidden' : 'idle';
    if (o.id === result?.answerId) return 'correct';
    if (o.id === chosen) return 'wrong';
    return 'dim';
  };
  const mood = isOpen
    ? !graded ? 'think' : graded === 'wrong' ? 'sad' : 'party'
    : !engine.answered ? 'think' : result?.correct ? 'party' : 'sad';

  return (
    <div className="space-y-4">
      <GameHud engine={engine} idx={idx} total={questions.length} onExit={onExit} />

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <Card className={engine.anim} key={q.id}>
          <div className="flex flex-wrap gap-2">
            <Tag>{q.system.icon} {q.system.name}</Tag>
            {isOpen && <span className="rounded-lg bg-gold/20 px-2.5 py-0.5 text-xs font-extrabold text-gold">✍️ DISCURSIVA</span>}
          </div>
          <h2 className="mb-5 mt-3 text-xl font-bold leading-relaxed">{q.text}</h2>

          {isOpen ? (
            <OpenQuestion
              q={q}
              text={text}
              setText={setText}
              review={review}
              graded={graded}
              timeout={timedOut}
              hint={hint}
              onSubmit={(v) => submitOpen(v)}
              onGrade={gradeOpen}
            />
          ) : (
            <>
              <div className="space-y-2.5">
                {q.options.map((o, i) => (
                  <button
                    key={o.id}
                    disabled={engine.answered}
                    onClick={() => answer(o.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(stateOf(o))}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card font-black text-brand shadow-sm">{LETTERS[i]}</span>
                    {o.text}
                  </button>
                ))}
              </div>
              {hint && !engine.answered && (
                <div className="mt-4 rounded-2xl border-l-4 border-gold bg-gold/10 p-3">💡 <b>Dica:</b> {hint}</div>
              )}
              {engine.answered && result && <Feedback result={result} timeout={chosen === -1}>{result.explanation}</Feedback>}
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {!isOpen && <Button variant="secondary" size="sm" disabled={!power.fifty || engine.answered} onClick={useFifty}>✂️ 50/50</Button>}
              <Button variant="secondary" size="sm" disabled={!power.hint || done || !!review} onClick={useHint}>💡 Dica</Button>
            </div>
            {done && <Button onClick={next}>{isLast ? 'Ver resultado 🏁' : 'Próxima ➜'}</Button>}
          </div>
        </Card>

        <div className="order-first lg:order-none">
          <MascotTalk mood={mood} size={100} text={speech} className="lg:sticky lg:top-20 lg:flex-col-reverse lg:items-center" />
        </div>
      </div>
    </div>
  );
}
