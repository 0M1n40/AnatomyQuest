import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { LETTERS } from '../../lib/progress.js';
import { TIME, useGameEngine } from '../../hooks/useGameEngine.js';
import { PHRASES, pick } from '../../lib/phrases.js';
import { Button, Card, Feedback, MascotTalk, SourceTag, Spinner, Tag, optionClass } from '../ui.jsx';
import GameHud from '../GameHud.jsx';
import AtlasViewer from './AtlasViewer.jsx';

export default function AtlasGame({ figure, type, onFinish, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [chosen, setChosen] = useState(undefined);
  const [organPick, setOrganPick] = useState(null);
  const [justPick, setJustPick] = useState(null);
  const busy = useRef(false);
  const timeoutRef = useRef(null);

  const engine = useGameEngine({ onTimeout: () => timeoutRef.current?.() });
  const { answered, register, start, lives, combo } = engine;

  useEffect(() => { api.atlas.quiz(figure, type, 15).then((d) => setQuestions(d.questions)).catch((e) => setError(e.message)); }, [figure, type]);

  const q = questions?.[idx];
  useEffect(() => { if (q) start(TIME[q.type] || TIME.name); }, [q, start]);

  const answer = useCallback(async (pinId) => {
    if (!q || answered || busy.current) return;
    busy.current = true;
    try {
      const r = await api.atlas.answer(q.token, pinId);
      setChosen(pinId);
      setResult(r);
      register(r.correct ? 'correct' : 'wrong', {
        text: q.type === 'name' ? `${q.figure.title}: qual é a estrutura indicada?` : `${q.figure.title}: onde está "${q.prompt}"?`,
        answer: r.label,
      });
    } catch (e) { setError(e.message); } finally { busy.current = false; }
  }, [q, answered, register]);

  const answerOrgan = useCallback(async (organ, just) => {
    if (!q || answered || busy.current) return;
    busy.current = true;
    try {
      const r = await api.atlas.answerOrgan(q.token, organ, just);
      setResult(r);
      const res = r.organOk && r.justOk ? 'correct' : r.organOk || r.justOk ? 'partial' : 'wrong';
      register(res, { text: 'Que lâmina é essa? (órgão + justificativa)', answer: `${r.organ} — ${r.justification}` });
    } catch (e) { setError(e.message); } finally { busy.current = false; }
  }, [q, answered, register]);

  timeoutRef.current = () => (q?.type === 'organ' ? answerOrgan(organPick, justPick) : answer(null));
  const isLast = questions && (idx + 1 >= questions.length || lives <= 0);

  const next = useCallback(() => {
    if (!answered) return;
    if (isLast) {
      onFinish({ mode: `atlas-${figure}`, points: engine.points, hits: engine.hits, total: engine.log.length, maxCombo: engine.maxCombo, log: engine.log, outOfLives: lives <= 0 });
      return;
    }
    setIdx((i) => i + 1);
    setResult(null); setChosen(undefined); setOrganPick(null); setJustPick(null);
  }, [answered, isLast, onFinish, figure, engine, lives]);

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
    if (!answered) return q?.type === 'locate' ? 'Encontra pra mim na imagem! 🔎' : q?.type === 'organ' ? pick(PHRASES.organ) : pick(PHRASES.atlasThink);
    const last = engine.log[engine.log.length - 1]?.result;
    if (last === 'correct') return combo >= 3 ? pick(PHRASES.combo(combo)) : pick(PHRASES.correct);
    if (last === 'partial') return pick(PHRASES.partial);
    return chosen === null ? pick(PHRASES.timeout) : pick(PHRASES.wrong);
  }, [answered, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Card className="text-center"><p className="mb-4 font-semibold text-accent">{error}</p><Button onClick={onExit}>Voltar</Button></Card>;
  if (!questions || !q) return <Spinner label="Preparando a prova prática…" />;

  const lastResult = engine.log[engine.log.length - 1]?.result;
  const mood = !answered ? 'think' : lastResult === 'wrong' ? 'sad' : 'party';

  let viewerProps = {};
  if (q.type === 'name') {
    viewerProps = { target: { x: q.target.x, y: q.target.y, state: answered ? (result.correct ? 'correct' : 'wrong') : null, label: answered ? result.label : null } };
  } else if (q.type === 'locate') {
    viewerProps = {
      onPinClick: answered ? undefined : (p) => answer(p.id),
      pins: q.pins.map((p) => ({
        ...p,
        state: !answered ? 'idle' : p.id === result.answerPinId ? 'correct' : p.id === chosen ? 'wrong' : 'dim',
        label: p.id === result?.answerPinId ? result.label : undefined,
        showLabel: answered && p.id === result.answerPinId,
      })),
    };
  } else if (q.type === 'organ' && answered) {
    viewerProps = { pins: result.pins.map((p, i) => ({ ...p, number: i + 1, state: 'study', showLabel: true })) };
  }
  const optState = (o) => {
    if (!answered) return 'idle';
    if (o.id === result.answerPinId || o.label === result.label) return 'correct';
    if (o.id === chosen) return 'wrong';
    return 'dim';
  };
  const choiceState = (value, picked, correctValue) => {
    if (!answered) return value === picked ? 'selected' : 'idle';
    if (value === correctValue) return 'correct';
    if (value === picked) return 'wrong';
    return 'dim';
  };

  return (
    <div className="space-y-4">
      <GameHud engine={engine} idx={idx} total={questions.length} onExit={onExit} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className={engine.anim} key={q.token}>
          <AtlasViewer image={q.figure.image} alt="Imagem da questão" className="max-w-2xl" {...viewerProps} />
        </div>
        <div className="space-y-3">
          <MascotTalk mood={mood} size={84} text={speech} />
          <Card>
            <div className="flex flex-wrap gap-2">
              <Tag>{q.type === 'organ' ? '🔬 Lâmina' : `🖼️ ${q.figure.title}`}</Tag>
              <SourceTag source={q.figure.source} />
            </div>
            {q.type === 'name' && (
              <>
                <h2 className="mb-4 mt-3 text-xl font-black">👉 Qual estrutura está sendo apontada?</h2>
                <div className="space-y-2.5">
                  {q.options.map((o, i) => (
                    <button key={o.id} disabled={answered} onClick={() => answer(o.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(optState(o))}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card font-black text-brand shadow-sm">{LETTERS[i]}</span>{o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {q.type === 'locate' && (
              <>
                <p className="mt-3 text-sm font-bold text-muted">📍 Clique no ponto da imagem que corresponde a:</p>
                <h2 className="mt-1 text-2xl font-black text-brand">{q.prompt}</h2>
              </>
            )}
            {q.type === 'organ' && (
              <div className="mt-3 space-y-4">
                <div>
                  <h2 className="mb-2 text-lg font-black">1️⃣ Que órgão é este?</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.organOptions.map((o) => (
                      <button key={o} disabled={answered} onClick={() => setOrganPick(o)}
                        className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold transition ${optionClass(choiceState(o, organPick, result?.organ))}`}>{o}</button>
                    ))}
                  </div>
                </div>
                {(organPick || answered) && (
                  <div className="animate-bounce-in">
                    <h2 className="mb-2 text-lg font-black">2️⃣ Qual é a justificativa?</h2>
                    <div className="space-y-2">
                      {q.justOptions.map((j) => (
                        <button key={j} disabled={answered} onClick={() => setJustPick(j)}
                          className={`block w-full rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${optionClass(choiceState(j, justPick, result?.justification))}`}>{j}</button>
                      ))}
                    </div>
                  </div>
                )}
                {!answered && <Button className="w-full" disabled={!organPick || !justPick} onClick={() => answerOrgan(organPick, justPick)}>Confirmar ✔</Button>}
              </div>
            )}
            {answered && q.type !== 'organ' && <Feedback result={result} timeout={chosen === null}><b>{result.label}</b>{result.explanation ? ` — ${result.explanation}` : ''}</Feedback>}
            {answered && q.type === 'organ' && (
              <Feedback result={lastResult}>
                <b>{result.organ}</b> {result.organOk ? '✔' : '✘'} · justificativa {result.justOk ? '✔' : '✘'}
                <br /><span className="text-sm">{result.justification}</span>
              </Feedback>
            )}
            {answered && <div className="mt-4 flex justify-end"><Button onClick={next}>{isLast ? 'Ver resultado 🏁' : 'Próxima ➜'}</Button></div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
