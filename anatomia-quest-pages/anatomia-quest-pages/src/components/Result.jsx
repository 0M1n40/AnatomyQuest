import { useMemo } from 'react';
import { Button, Card, MascotTalk, Stars } from './ui.jsx';
import { PHRASES, pick } from '../lib/phrases.js';

export default function Result({ data, onReplay, onMenu, menuLabel = 'Início' }) {
  const { hits, total, points, maxCombo, log, outOfLives, saved } = data;
  const pct = total ? Math.round((hits / total) * 100) : 0;
  const stars = saved?.session.stars ?? (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0);
  const msg = useMemo(() => pick(pct >= 90 ? PHRASES.win : pct >= 60 ? PHRASES.ok : PHRASES.low), [pct]);
  const mood = pct >= 70 ? 'party' : pct >= 50 ? 'happy' : 'sad';

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <MascotTalk mood={mood} size={120} text={msg} className="justify-center" />
        <h2 className="mt-2 text-3xl font-black">{outOfLives ? 'Fim das vidas!' : 'Fase concluída!'}</h2>
        <Stars n={stars} size="text-4xl" />
        <div className="mx-auto my-4 grid max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['🎯', 'Acertos', `${hits}/${total}`],
            ['📊', 'Aproveit.', `${pct}%`],
            ['🏅', 'Pontos', points],
            ['🔥', 'Sequência', maxCombo],
          ].map(([i, l, v]) => (
            <div key={l} className="rounded-2xl bg-soft p-3">
              <div className="text-xl">{i}</div>
              <div className="text-lg font-black">{v}</div>
              <div className="text-xs font-bold text-muted">{l}</div>
            </div>
          ))}
        </div>
        {saved && <p className="font-black text-brand">+{saved.session.xp} XP</p>}
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={onReplay}>↻ Jogar de novo</Button>
          <Button variant="secondary" onClick={onMenu}>{menuLabel}</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-lg font-black">📋 Gabarito da partida</h3>
        <ul className="divide-y divide-line">
          {log.map((l, i) => (
            <li key={i} className="flex gap-3 py-3">
              <span className={`mt-0.5 font-black ${l.correct ? 'text-emerald-500' : 'text-accent'}`}>{l.correct ? '✔' : '✘'}</span>
              <div>
                <p className="font-semibold">{l.text}</p>
                <p className="text-sm text-muted">Resposta: <b>{l.answer}</b></p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
