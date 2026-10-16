import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Card, Pill, Spinner, Tag } from './ui.jsx';

export default function Flashcards({ systems }) {
  const [system, setSystem] = useState('');
  const [cards, setCards] = useState(null);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    setCards(null);
    api.flashcards(system).then((c) => { setCards(c); setI(0); setFlip(false); });
  }, [system]);

  const go = (d) => { setFlip(false); setI((x) => (x + d + cards.length) % cards.length); };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-black">🃏 Flashcards</h1>
        <div className="flex items-center gap-2">
          <select value={system} onChange={(e) => setSystem(e.target.value)} className="rounded-2xl border border-line bg-card px-3 py-2 font-semibold">
            <option value="">Todos os sistemas</option>
            {systems.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
          {cards && <Pill>{i + 1}/{cards.length}</Pill>}
        </div>
      </div>

      {!cards ? <Spinner /> : (
        <Card>
          <Tag>{cards[i].icon} {cards[i].system}</Tag>
          <div className="perspective mt-3 h-72 cursor-pointer" onClick={() => setFlip((f) => !f)}>
            <div className={`preserve-3d relative h-full w-full transition-transform duration-500 ${flip ? 'rotate-y-180' : ''}`}>
              <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-soft p-6 text-center text-xl font-bold">
                {cards[i].front}
                <small className="mt-4 text-sm font-semibold text-muted">toque para virar ↻</small>
              </div>
              <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-brand/15 p-6 text-center">
                <b className="text-2xl font-black text-brand">{cards[i].back}</b>
                <p className="mt-3 font-semibold">{cards[i].explanation}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => go(-1)}>◀ Anterior</Button>
            <Button onClick={() => go(1)}>Próximo ▶</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
