import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { LETTERS } from '../../lib/progress.js';
import { PHRASES, pick } from '../../lib/phrases.js';
import { Button, Card, Feedback, MascotTalk, OpenTag, Pill, SourceTag, Spinner, Stars, Tag, optionClass } from '../ui.jsx';
import { OpenInput, OpenReview } from '../OpenQuestion.jsx';
import AtlasViewer from '../atlas/AtlasViewer.jsx';

const KIND = { mcq: { icon: '📝', name: 'Objetiva' }, open: { icon: '✍️', name: 'Discursiva' }, image: { icon: '🔬', name: 'Identificação' } };
const SCORE = { correct: 1, partial: 0.5, wrong: 0 };
const fmtGrade = (n) => n.toFixed(1).replace('.', ',');
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const optLetter = (item, i) => (item.options?.length === 2 ? (i ? 'F' : 'V') : LETTERS[i]);

// ---------------- 1. Configuração ----------------
function Setup({ subject, onStart }) {
  const av = api.exam.availability();
  const clampN = (n, max) => Math.max(0, Math.min(max, n));
  const PRESETS = [
    { id: 'short', name: 'Prova curta', icon: '⚡', mcq: 8, open: 2, image: 3, minutes: 25, source: 'all' },
    { id: 'full', name: 'Prova completa', icon: '📚', mcq: 15, open: 5, image: 5, minutes: 60, source: 'all' },
    ...(av.past ? [{ id: 'past', name: 'Estilo da prova real', icon: '📄', mcq: 12, open: 3, image: 4, minutes: 50, source: 'past' }] : []),
    { id: 'practice', name: 'Só prática + discursivas', icon: '🔬', mcq: 0, open: 5, image: 8, minutes: 40, source: 'all' },
  ];
  const fit = (p) => ({ ...p, mcq: clampN(p.mcq, av.mcq), open: clampN(p.open, av.open), image: clampN(p.image, av.image) });
  const [cfg, setCfg] = useState(fit(PRESETS[0]));
  const total = cfg.mcq + cfg.open + cfg.image;
  const speech = useMemo(() => pick(PHRASES.exam), []);

  const Counter = ({ k, label, max, desc }) => (
    <div className="rounded-2xl bg-soft p-4">
      <div className="flex items-center justify-between">
        <span className="font-black">{KIND[k].icon} {label}</span>
        <span className="text-xs font-bold text-muted">máx. {max}</span>
      </div>
      <p className="mb-2 text-xs text-muted">{desc}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={cfg[k] <= 0} onClick={() => setCfg({ ...cfg, id: 'custom', [k]: cfg[k] - 1 })}>−</Button>
        <span className="w-10 text-center text-2xl font-black">{cfg[k]}</span>
        <Button size="sm" variant="secondary" disabled={cfg[k] >= max} onClick={() => setCfg({ ...cfg, id: 'custom', [k]: cfg[k] + 1 })}>+</Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <MascotTalk mood="think" size={100} text={speech} />
      <Card>
        <h1 className="text-2xl font-black">📝 Simulado de prova · {subject.name}</h1>
        <p className="mb-4 text-muted">Como na prova real: sem dicas, sem gabarito durante a prova e com tempo total. Ao entregar, você vê a correção e a nota de 0 a 10.</p>

        <h2 className="mb-2 font-black">Modelo</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => {
            const f = fit(p);
            return (
              <button key={p.id} onClick={() => setCfg(f)}
                className={`rounded-2xl border-2 p-3 text-left transition ${cfg.id === p.id ? 'border-brand bg-brand/10' : 'border-line hover:border-brand'}`}>
                <b>{p.icon} {p.name}</b>
                <p className="text-xs font-semibold text-muted">{f.mcq} obj · {f.open} disc · {f.image} img · {p.minutes} min{p.source === 'past' ? ' · prioriza o que já caiu' : ''}</p>
              </button>
            );
          })}
        </div>

        <h2 className="mb-2 font-black">Questões</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <Counter k="mcq" label="Objetivas" max={av.mcq} desc="Múltipla escolha e V/F." />
          <Counter k="open" label="Discursivas" max={av.open} desc="Você escreve; corrige com o modelo no fim." />
          <Counter k="image" label="Imagens" max={av.image} desc={av.organ ? 'Identifique o órgão e justifique.' : 'Identifique a estrutura apontada.'} />
        </div>

        {av.past > 0 && (
          <>
            <h2 className="mb-2 font-black">Origem das questões</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {[['all', '🎲 Todo o conteúdo'], ['past', `📄 Priorizar prova/quiz/estudo dirigido (${av.past})`]].map(([v, l]) => (
                <button key={v} onClick={() => setCfg({ ...cfg, source: v })}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${cfg.source === v ? 'bg-accent text-white' : 'bg-soft hover:bg-line'}`}>{l}</button>
              ))}
            </div>
          </>
        )}

        <h2 className="mb-2 font-black">Tempo total</h2>
        <div className="mb-5 flex flex-wrap gap-2">
          {[0, 20, 30, 45, 60, 90].map((m) => (
            <button key={m} onClick={() => setCfg({ ...cfg, minutes: m })}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${cfg.minutes === m ? 'bg-brand text-brand-ink' : 'bg-soft hover:bg-line'}`}>{m ? `${m} min` : 'Sem limite'}</button>
          ))}
        </div>

        <Button size="lg" variant="accent" className="w-full" disabled={!total} onClick={() => onStart(cfg)}>Começar prova ({total} questões) ➜</Button>
      </Card>
    </div>
  );
}

// ---------------- 2. Prova ----------------
function QuestionView({ item, value, onChange }) {
  if (item.kind === 'mcq') {
    const tf = item.options.length === 2;
    return (
      <div className={tf ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5'}>
        {item.options.map((o, i) => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(value === o.id ? 'selected' : 'idle')}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black shadow-sm ${value === o.id ? 'bg-brand text-brand-ink' : 'bg-card text-brand'}`}>{optLetter(item, i)}</span>
            {o.text}
          </button>
        ))}
      </div>
    );
  }
  if (item.kind === 'open') return <OpenInput text={value || ''} setText={onChange} keyCount={item.keyCount} />;
  const v = value || {};
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <AtlasViewer image={item.figure.image} alt="Imagem da questão" className="max-w-2xl" target={item.type === 'name' ? { x: item.target.x, y: item.target.y } : undefined} />
      {item.type === 'organ' ? (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-black">1️⃣ Identifique o órgão</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {item.organOptions.map((o) => (
                <button key={o} onClick={() => onChange({ ...v, organ: o })}
                  className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-bold transition ${optionClass(v.organ === o ? 'selected' : 'idle')}`}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-black">2️⃣ Justifique</h3>
            <div className="space-y-2">
              {item.justOptions.map((j) => (
                <button key={j} onClick={() => onChange({ ...v, just: j })}
                  className={`block w-full rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${optionClass(v.just === j ? 'selected' : 'idle')}`}>{j}</button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <h3 className="font-black">👉 Qual estrutura está sendo apontada?</h3>
          {item.options.map((o, i) => (
            <button key={o.id} onClick={() => onChange(o.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${optionClass(value === o.id ? 'selected' : 'idle')}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card font-black text-brand shadow-sm">{LETTERS[i]}</span>{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const isAnswered = (item, v) => {
  if (v === undefined || v === null) return false;
  if (item.kind === 'open') return v.trim().length > 0;
  if (item.kind === 'image' && item.type === 'organ') return !!(v.organ && v.just);
  return true;
};

function Run({ items, minutes, onSubmit, onExit }) {
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});
  const [deadline] = useState(() => (minutes ? Date.now() + minutes * 60000 : null));
  const [left, setLeft] = useState(minutes * 60);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) { clearInterval(t); onSubmit(answersRef.current, true); }
    }, 500);
    return () => clearInterval(t);
  }, [deadline]); // eslint-disable-line react-hooks/exhaustive-deps

  const item = items[cur];
  const done = items.filter((it) => isAnswered(it, answers[it.id])).length;
  const set = (v) => setAnswers((a) => ({ ...a, [item.id]: v }));
  const deliver = () => {
    const missing = items.length - done;
    if (missing && !confirm(`Você deixou ${missing} questão(ões) sem resposta. Entregar mesmo assim?`)) return;
    onSubmit(answers, false);
  };

  return (
    <div className="space-y-4">
      <Card className="sticky top-14 z-20 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => confirm('Sair da prova? Suas respostas serão perdidas.') && onExit()}>⟵ Sair</Button>
          <Pill>✅ {done}/{items.length} respondidas</Pill>
          {deadline && <Pill className={left < 300 ? 'animate-pulse bg-accent/15 text-accent' : ''}>⏱️ {fmtTime(left)}</Pill>}
          <div className="flex-1" />
          <Button variant="accent" size="sm" onClick={deliver}>📤 Entregar prova</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <button key={it.id} onClick={() => setCur(i)} title={KIND[it.kind].name}
              className={`h-8 min-w-8 rounded-lg px-1.5 text-xs font-black transition ${i === cur ? 'ring-2 ring-brand' : ''} ${isAnswered(it, answers[it.id]) ? 'bg-brand text-brand-ink' : 'bg-soft text-muted hover:bg-line'}`}>
              {i + 1}{it.kind !== 'mcq' ? KIND[it.kind].icon : ''}
            </button>
          ))}
        </div>
      </Card>
      <Card key={item.id}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-muted">QUESTÃO {cur + 1}</span>
          <Tag>{KIND[item.kind].icon} {KIND[item.kind].name}</Tag>
          {item.system && <Tag>{item.system.icon} {item.system.name}</Tag>}
          {item.kind === 'open' && <OpenTag />}
          <SourceTag source={item.source || item.figure?.source} />
        </div>
        <h2 className="mb-5 mt-3 text-xl font-bold leading-relaxed">
          {item.kind === 'image' ? (item.type === 'organ' ? 'Identifique histologicamente o órgão e justifique a sua resposta.' : 'Identifique a estrutura indicada na imagem.') : item.text}
        </h2>
        <QuestionView item={item} value={answers[item.id]} onChange={set} />
        <div className="mt-5 flex justify-between">
          <Button variant="secondary" disabled={cur === 0} onClick={() => setCur(cur - 1)}>◀ Anterior</Button>
          {cur + 1 < items.length ? <Button onClick={() => setCur(cur + 1)}>Próxima ▶</Button> : <Button variant="accent" onClick={deliver}>📤 Entregar</Button>}
        </div>
      </Card>
    </div>
  );
}

// ---------------- 3. Correção ----------------
async function gradeAll(player, items, answers) {
  const out = [];
  for (const it of items) {
    const v = answers[it.id];
    if (it.kind === 'mcq') {
      const r = await api.answer(player, it.id, Number.isInteger(v) ? v : -1);
      out.push({ status: r.correct ? 'correct' : 'wrong', r, v });
    } else if (it.kind === 'open') {
      const r = await api.answerOpen(it.id, v || '');
      out.push({ status: 'pending', r: { ...r, answer: (v || '').trim() }, v });
    } else if (it.type === 'organ') {
      const r = await api.atlas.answerOrgan(it.token, v?.organ, v?.just);
      out.push({ status: r.organOk && r.justOk ? 'correct' : r.organOk || r.justOk ? 'partial' : 'wrong', r, v });
    } else {
      const r = await api.atlas.answer(it.token, v ?? null);
      out.push({ status: r.correct ? 'correct' : 'wrong', r, v });
    }
  }
  return out;
}

function ReviewItem({ i, item, res, onGrade }) {
  const [open, setOpen] = useState(res.status !== 'correct');
  const badge = { correct: ['✔ Certa', 'bg-emerald-500/15 text-emerald-600'], partial: ['◐ Parcial', 'bg-gold/20 text-gold'], wrong: ['✘ Errada', 'bg-accent/15 text-accent'], pending: ['✍️ Corrigir', 'bg-gold/20 text-gold animate-pulse'] }[res.status];
  const choice = (val, picked, right) => (val === right ? 'correct' : val === picked ? 'wrong' : 'dim');
  return (
    <Card className={res.status === 'pending' ? 'border-gold' : ''}>
      <button className="flex w-full flex-wrap items-center gap-2 text-left" onClick={() => setOpen(!open)}>
        <span className="font-black">{i + 1}.</span>
        <Tag>{KIND[item.kind].icon} {KIND[item.kind].name}</Tag>
        <SourceTag source={item.source || item.figure?.source} />
        <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${badge[1]}`}>{badge[0]}</span>
        <span className="flex-1 truncate text-sm font-semibold text-muted">{item.kind === 'image' ? (res.r.organ || res.r.label) : item.text}</span>
        <span className="text-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {item.kind !== 'image' && <p className="font-bold leading-relaxed">{item.text}</p>}
          {item.kind === 'mcq' && (
            <>
              <div className="space-y-2">
                {item.options.map((o, k) => (
                  <div key={o.id} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 font-semibold ${optionClass(choice(o.id, res.v, res.r.answerId))}`}>
                    <b className="text-brand">{optLetter(item, k)}</b>{o.text}{o.id === res.v && <span className="ml-auto text-xs font-black">sua resposta</span>}
                  </div>
                ))}
              </div>
              {res.v === undefined && <p className="text-sm font-bold text-accent">Questão deixada em branco.</p>}
              <Feedback result={res.status}>{res.r.explanation}</Feedback>
            </>
          )}
          {item.kind === 'open' && <OpenReview review={res.r} graded={res.status === 'pending' ? null : res.status} onGrade={onGrade} />}
          {item.kind === 'image' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <AtlasViewer image={item.figure.image} alt="Imagem" className="max-w-xl"
                target={item.type === 'name' ? { x: item.target.x, y: item.target.y, state: res.status, label: res.r.label } : undefined}
                pins={item.type === 'organ' ? res.r.pins.map((p, k) => ({ ...p, number: k + 1, state: 'study', showLabel: true })) : []} />
              <div>
                {item.type === 'organ' ? (
                  <>
                    <p className="text-sm font-bold">Seu órgão: <span className={res.r.organOk ? 'text-emerald-600' : 'text-accent'}>{res.v?.organ || '(em branco)'}</span></p>
                    <p className="text-sm font-bold">Sua justificativa: <span className={res.r.justOk ? 'text-emerald-600' : 'text-accent'}>{res.v?.just || '(em branco)'}</span></p>
                    <Feedback result={res.status}><b>{res.r.organ}</b><br /><span className="text-sm">{res.r.justification}</span></Feedback>
                  </>
                ) : (
                  <Feedback result={res.status}><b>{res.r.label}</b>{res.r.explanation ? ` — ${res.r.explanation}` : ''}</Feedback>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Review({ player, items, results, setResults, timeUp, onFinish, onRetry, onExit, saved }) {
  const pending = results.filter((r) => r.status === 'pending').length;
  const score = results.reduce((s, r) => s + (SCORE[r.status] || 0), 0);
  const grade = items.length ? (score / items.length) * 10 : 0;
  const byKind = Object.keys(KIND).map((k) => {
    const idxs = items.map((it, i) => (it.kind === k ? i : -1)).filter((i) => i >= 0);
    return { k, n: idxs.length, s: idxs.reduce((t, i) => t + (SCORE[results[i].status] || 0), 0) };
  }).filter((x) => x.n);

  const gradeOpen = async (i, status) => {
    await api.gradeOpen(player.name, items[i].id, status);
    setResults((rs) => rs.map((r, k) => (k === i ? { ...r, status } : r)));
  };

  const sent = useRef(false);
  useEffect(() => {
    if (!pending && !saved && !sent.current) { sent.current = true; onFinish({ grade, score, total: items.length }); }
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  const stars = grade >= 9 ? 3 : grade >= 7 ? 2 : grade >= 5 ? 1 : 0;
  const mood = pending ? 'think' : grade >= 7 ? 'party' : grade >= 5 ? 'happy' : 'sad';
  const speech = pending
    ? `Falta corrigir ${pending} discursiva(s). Compare com o modelo e se autoavalie! ✍️`
    : grade >= 9 ? pick(PHRASES.win) : grade >= 7 ? 'Aprovado(a) com folga! 🎓' : grade >= 5 ? 'Passou! Revisa os erros para garantir na prova real 📚' : pick(PHRASES.low);

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <MascotTalk mood={mood} size={110} text={speech} className="justify-center" />
        {timeUp && <p className="font-bold text-accent">⏰ O tempo acabou e a prova foi entregue automaticamente.</p>}
        {pending ? (
          <p className="mt-2 text-lg font-black">Nota parcial (sem as discursivas): {fmtGrade((score / items.length) * 10)}</p>
        ) : (
          <>
            <p className="mt-2 text-sm font-black uppercase text-muted">Sua nota</p>
            <p className={`text-6xl font-black ${grade >= 7 ? 'text-emerald-500' : grade >= 5 ? 'text-gold' : 'text-accent'}`}>{fmtGrade(grade)}</p>
            <Stars n={stars} size="text-3xl" />
            {saved && <p className="font-black text-brand">+{saved.session.xp} XP</p>}
          </>
        )}
        <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-3">
          {byKind.map(({ k, n, s }) => (
            <div key={k} className="rounded-2xl bg-soft p-3">
              <div className="text-xl">{KIND[k].icon}</div>
              <div className="text-lg font-black">{String(s).replace('.', ',')}/{n}</div>
              <div className="text-xs font-bold text-muted">{KIND[k].name}s</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry}>↻ Novo simulado</Button>
          <Button variant="secondary" onClick={onExit}>Início</Button>
        </div>
      </Card>
      <h2 className="text-lg font-black">📋 Correção {pending > 0 && <span className="text-gold">· corrija as discursivas marcadas</span>}</h2>
      {items.map((it, i) => <ReviewItem key={it.id} i={i} item={it} res={results[i]} onGrade={(s) => gradeOpen(i, s)} />)}
    </div>
  );
}

// ---------------- Controle ----------------
export default function Exam({ player, subject, onSaved, onExit }) {
  const [phase, setPhase] = useState('setup');
  const [cfg, setCfg] = useState(null);
  const [items, setItems] = useState(null);
  const [results, setResults] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');

  const start = async (c) => {
    setCfg(c); setPhase('loading'); setSaved(null); setTimeUp(false);
    try {
      setItems(await api.exam.build(c));
      setPhase('run');
      window.scrollTo({ top: 0 });
    } catch (e) { setError(e.message); setPhase('setup'); }
  };
  const submit = async (answers, byTime) => {
    setPhase('loading'); setTimeUp(byTime);
    setResults(await gradeAll(player.name, items, answers));
    setPhase('review');
    window.scrollTo({ top: 0 });
  };
  const finish = async ({ grade, score, total }) => {
    const s = await api.finish(player.name, { mode: 'exam', points: Math.round(grade * 100), hits: score, total, grade: Math.round(grade * 10) / 10 });
    setSaved(s);
    onSaved?.(s.player);
  };

  if (phase === 'loading') return <Spinner label="Preparando…" />;
  if (phase === 'setup') return <>{error && <p className="mb-2 text-center font-bold text-accent">{error}</p>}<Setup subject={subject} onStart={start} /></>;
  if (phase === 'run') return <Run items={items} minutes={cfg.minutes} onSubmit={submit} onExit={onExit} />;
  return <Review player={player} items={items} results={results} setResults={setResults} timeUp={timeUp} saved={saved} onFinish={finish} onRetry={() => setPhase('setup')} onExit={onExit} />;
}
