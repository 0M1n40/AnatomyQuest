import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Button, Card, MascotTalk, Spinner } from '../ui.jsx';
import AtlasViewer from './AtlasViewer.jsx';

export default function AtlasStudy({ figureId, onBack, onPlay }) {
  const [fig, setFig] = useState(null);
  const [sel, setSel] = useState(null);
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => { api.atlas.figure(figureId).then(setFig).catch((e) => setError(e.message)); }, [figureId]);

  if (error) return <Card className="text-center text-accent">{error}</Card>;
  if (!fig) return <Spinner />;

  const choose = (id) => { setSel(id); setRevealed((r) => new Set(r).add(id)); };
  const visible = (id) => !hide || revealed.has(id);
  const current = fig.pins.find((p) => p.id === sel);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onBack}>⟵ Atlas</Button>
        <h1 className="flex-1 text-xl font-black">📖 {fig.title}</h1>
        <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-soft px-3 py-1.5 text-sm font-bold">
          <input type="checkbox" checked={hide} onChange={(e) => { setHide(e.target.checked); setRevealed(new Set()); setSel(null); }} />
          Esconder nomes (autoteste)
        </label>
        <Button size="sm" onClick={() => onPlay(fig.id, 'mix')}>Me testar ➜</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <AtlasViewer
          image={fig.image}
          alt={fig.title}
          className="max-w-xl"
          onPinClick={(p) => choose(p.id)}
          pins={fig.pins.map((p, i) => ({
            ...p,
            number: i + 1,
            state: p.id === sel ? 'selected' : 'study',
            showLabel: p.id === sel && visible(p.id),
          }))}
        />

        <div className="space-y-3">
          <Card className="min-h-28">
            {current ? (
              <>
                <p className="text-xs font-black text-muted">PONTO {fig.pins.indexOf(current) + 1}</p>
                <h2 className="text-xl font-black text-brand">{current.label}</h2>
                {current.explanation && <p className="mt-1 font-semibold">{current.explanation}</p>}
              </>
            ) : (
              <MascotTalk mood="happy" size={70} text={hide ? 'Tente lembrar o nome antes de tocar no ponto! 🧠' : 'Toque em um número para ver a estrutura.'} />
            )}
          </Card>
          <Card className="max-h-[50vh] overflow-auto p-3">
            <ol className="space-y-1">
              {fig.pins.map((p, i) => (
                <li key={p.id}>
                  <button
                    onClick={() => choose(p.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition ${p.id === sel ? 'bg-gold/20' : 'hover:bg-soft'}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">{i + 1}</span>
                    {visible(p.id) ? p.label : <span className="text-muted">? ? ?</span>}
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
