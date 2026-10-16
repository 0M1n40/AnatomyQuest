import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { useGameEngine } from '../../hooks/useGameEngine.js';
import { PHRASES, pick } from '../../lib/phrases.js';
import { Button, Card, Feedback, MascotTalk, Spinner, Tag, optionClass } from '../ui.jsx';
import GameHud from '../GameHud.jsx';
import AtlasViewer from './AtlasViewer.jsx';

const LETTERS = 'ABCD';

export default function AtlasGame({ figure, type, onFinish, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [chosen, setChosen] = useState(undefined);
  const busy = useRef(false);
  const answerRef = useRef(null);

  const engine = useGameEngine({ onTimeout: () => answerRef.current?.(null) });
  const { answered, register, resetTurn, setRunning, lives, combo } = engine;

  useEffect(() => {
    api.atlas.quiz(figure, type, 15)
      .then((d) => { setQuestions(d.questions); setRunning(true); })
      .catch((e) => setError(e.message));
  }, [figure, type, setRunning]);

  const q = questions?.[idx];

  const answer = useCallback(async (pinId) => {
    if (!q || answered || busy.current) return;
    busy.current = true;
    try {
      const r = await api.atlas.answer(q.token, pinId);
      setChosen(pinId);
      setResult(r);
      register(r.correct, {
        text: q.type === 'name' ? `${q.figure.title}: qual é a estrutura indicada?` : `${q.figure.title}: onde está "${q.prompt}"?`,
        answer: r.label,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      busy.current = false;
    }
  }, [q, answered, register]);
  answerRef.current = answer;

  const isLast = questions && (idx + 1 >= questions.length || lives <= 0);

  const next = useCallback(() => {
    if (!answered) return;
    if (isLast) {
      onFinish({ mode: `atlas-${figure}`, points: engine.points, hits: engine.hits, total: engine.log.length, maxCombo: engine.maxCombo, log: engine.log, outOfLives: lives <= 0 });
      return;
    }
    setIdx((i) => i + 1);
    setResult(null);
    setChosen(undefined);
    resetTurn();
  }, [answered, isLast, onFinish, figure, engine, lives, resetTurn]);

  useEffect(() => {
    const onKey = (e) => {
      const k = 'abcd'.indexOf(e.key.toLowerCase());
      if (q?.type === 'name' && k >= 0 && q.options[k] && !answered) answer(q.options[k].id);
      if (e.key === 'Enter') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, answered, answer, next]);

  const speech = useMemo(() => {
    if (!answered) return q?.type === 'locate' ? 'Encontra pra mim no desenho! 🔎' : pick(PHRASES.atlasThink);
    if (result?.correct) return combo >= 3 ? pick(PHRASES.combo(combo)) : pick(PHRASES.correct);
    return chosen === null ? pick(PHRASES.timeout) : pick(PHRASES.wrong);
  }, [answered, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Card className="text-center"><p className="mb-4 font-semibold text-accent">{error}</p><Button onClick={onExit}>Voltar ao Atlas</Button></Card>;
  if (!questions) return <Spinner label="Preparando a prova prática…" />;

  const mood = !answered ? 'think' : result.correct ? 'party' : 'sad';

  let viewerProps;
  if (q.type === 'name') {
    viewerProps = {
      target: { x: q.target.x, y: q.target.y, state: answered ? (result.correct ? 'correct' : 'wrong') : null, label: answered ? result.label : null },
    };
  } else {
    viewerProps = {
      onPinClick: answered ? undefined : (p) => answer(p.id),
      pins: q.pins.map((p) => ({
        ...p,
        state: !answered ? 'idle' : p.id === result.answerPinId ? 'correct' : p.id === chosen ? 'wrong' : 'dim',
        label: p.id === result?.answerPinId ? result.label : undefined,
        showLabel: answered && p.id === result.answerPinId,
      })),
    };
  }

  const optState = (o) => {
    if (!answered) return 'idle';
    if (o.id === result.answerPinId || o.label === result.label) return 'correct';
    if (o.id === chosen) return 'wrong';
    return 'dim';
  };

  return (
    <div className="space-y-4">
      <GameHud engine={engine} idx={idx} total={questions.length} onExit={onExit} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={engine.anim} key={q.token}>
          <AtlasViewer image={q.figure.image} alt={q.figure.title} className="max-w-md" {...viewerProps} />
        </div>

        <div className="space-y-3">
          <MascotTalk mood={mood} size={84} text={speech} />
          <Card>
            <Tag>🖼️ {q.figure.title}</Tag>
            {q.type === 'name' ? (
              <>
                <h2 className="mb-4 mt-3 text-xl font-black">👉 Qual estrutura está sendo apontada?</h2>
                <div className="space-y-2.5">
                  {q.options.map((o, i) => (
                    <button
                      key={o.id}
                      disabled={answered}
                      onClick={() => answer(o.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(optState(o))}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card font-black text-brand shadow-sm">{LETTERS[i]}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm font-bold text-muted">📍 Clique no ponto da figura que corresponde a:</p>
                <h2 className="mt-1 text-2xl font-black text-brand">{q.prompt}</h2>
              </>
            )}

            {answered && (
              <Feedback result={result} timeout={chosen === null}>
                <b>{result.label}</b>{result.explanation ? ` — ${result.explanation}` : ''}
              </Feedback>
            )}
            {answered && (
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>{isLast ? 'Ver resultado 🏁' : 'Próxima ➜'}</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
