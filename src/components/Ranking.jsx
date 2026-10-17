import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Card, Spinner } from './ui.jsx';

export default function Ranking({ systems, me, subject }) {
  const [mode, setMode] = useState('xp');
  const [rows, setRows] = useState(null);

  useEffect(() => { setRows(null); api.ranking(mode).then(setRows).catch(() => setRows([])); }, [mode, subject.id]);

  const tabs = [
    { id: 'xp', name: 'XP geral', icon: '✨' },
    { id: 'all', name: 'Simulado', icon: '🔥' },
    { id: 'atlas-all', name: subject.practice.nav, icon: subject.practice.icon },
    ...systems,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h1 className="text-2xl font-black">🏅 Ranking · {subject.name}</h1>
        <p className="mb-3 text-sm text-muted">Jogadores que usaram este navegador/dispositivo. O XP soma todas as matérias.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`rounded-full px-3 py-1 text-sm font-bold transition ${mode === t.id ? 'bg-brand text-brand-ink' : 'bg-soft hover:bg-line'}`}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
        {!rows ? <Spinner /> : rows.length === 0 ? (
          <p className="py-8 text-center font-semibold text-muted">Ninguém jogou este modo ainda. Seja o primeiro! 🚀</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => {
              const mine = r.name.toLowerCase() === me.toLowerCase();
              return (
                <li key={r.name} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${mine ? 'bg-brand/15 font-black text-brand' : 'bg-soft'}`}>
                  <span className="font-bold">{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {r.name}</span>
                  <span className="font-black">
                    {r.value} {mode === 'xp' ? 'XP' : 'pts'}
                    {r.pct != null && <small className="font-semibold text-muted"> · {r.pct}%</small>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
