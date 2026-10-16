import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { SYSTEM_LABEL } from '../../lib/progress.js';
import { Button, Card, MascotTalk, Spinner, Stars } from '../ui.jsx';

const MODES = [
  { type: 'study', icon: '📖', title: 'Estudar', desc: 'Toque nos pontos e veja o nome de cada estrutura.' },
  { type: 'name', icon: '👉', title: 'Qual é a estrutura?', desc: 'A professora aponta. Você diz o nome.' },
  { type: 'locate', icon: '📍', title: 'Onde está?', desc: 'Você recebe o nome e clica no ponto certo.' },
  { type: 'mix', icon: '🎲', title: 'Prova prática', desc: 'Mistura os dois modos, valendo pontos.' },
];

export default function AtlasHub({ player, onStudy, onPlay, onEditor }) {
  const [figures, setFigures] = useState(null);
  const [sel, setSel] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { api.atlas.figures().then(setFigures).catch((e) => setError(e.message)); }, []);

  if (error) return <Card className="text-center font-semibold text-accent">{error}</Card>;
  if (!figures) return <Spinner label="Abrindo o atlas…" />;

  const current = figures.find((f) => f.id === sel);
  const go = (type) => (type === 'study' ? onStudy(sel) : onPlay(sel, type));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MascotTalk mood="think" size={90} text="Na prova prática a professora aponta e você identifica. Vamos treinar o olho! 👀" />
        <Button variant="secondary" onClick={onEditor}>✏️ Editor da professora</Button>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-black">1. Escolha a figura</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            onClick={() => setSel('all')}
            className={`flex flex-col items-center justify-center rounded-3xl border-2 bg-card p-4 text-center transition hover:-translate-y-1 ${sel === 'all' ? 'border-brand shadow-lg' : 'border-line'}`}
          >
            <span className="text-5xl">🧩</span>
            <b className="mt-2">Todas as figuras</b>
            <small className="text-muted">{figures.reduce((s, f) => s + f.pinCount, 0)} estruturas</small>
            <Stars n={player.stars['atlas-all'] || 0} />
          </button>
          {figures.map((f) => (
            <button
              key={f.id}
              onClick={() => setSel(f.id)}
              className={`overflow-hidden rounded-3xl border-2 bg-card text-left transition hover:-translate-y-1 ${sel === f.id ? 'border-brand shadow-lg' : 'border-line'}`}
            >
              <div className="aspect-[4/5] bg-white"><img src={f.image} alt="" className="h-full w-full object-contain" /></div>
              <div className="p-3">
                <b className="line-clamp-2 text-sm leading-tight">{f.title}</b>
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>{SYSTEM_LABEL[f.system] || f.system} · {f.pinCount} pts</span>
                  <Stars n={player.stars[`atlas-${f.id}`] || 0} size="text-xs" />
                </div>
                {!f.builtin && <span className="mt-1 inline-block rounded bg-gold/20 px-1.5 text-[10px] font-black text-gold">DA PROFESSORA</span>}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black">2. Escolha o modo {current && <span className="text-muted">· {current.title}</span>}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => {
            const disabled = (m.type === 'study' && sel === 'all') || (current && current.pinCount < (m.type === 'locate' ? 3 : 1));
            return (
              <button
                key={m.type}
                disabled={disabled}
                onClick={() => go(m.type)}
                className="rounded-3xl border border-line bg-card p-4 text-left transition enabled:hover:-translate-y-1 enabled:hover:border-brand disabled:opacity-40"
              >
                <span className="text-3xl">{m.icon}</span>
                <h3 className="mt-1 font-black">{m.title}</h3>
                <p className="text-sm text-muted">{m.type === 'study' && sel === 'all' ? 'Escolha uma figura específica para estudar.' : m.desc}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
