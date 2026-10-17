import { useMemo } from 'react';
import { Button, Card, MascotTalk, Pill, ProgressBar, Stars } from './ui.jsx';
import { level, levelProgress, title } from '../lib/progress.js';
import { PHRASES, pick } from '../lib/phrases.js';

export default function Home({ player, subject, systems, onPlay, onNavigate, onReset }) {
  const total = systems.reduce((s, x) => s + x.total, 0);
  const openTotal = systems.reduce((s, x) => s + x.open, 0);
  const greet = useMemo(() => pick(PHRASES.greet(player.name.split(' ')[0], subject.name)), [player.name, subject.name]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-gradient-to-br from-brand/10 via-card to-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <MascotTalk mood="happy" size={130} text={greet} className="md:flex-1" />
          <div className="md:w-72">
            <div className="mb-2 flex flex-wrap gap-2">
              <Pill>{subject.icon} {subject.name}</Pill>
              <Pill>⭐ Nível {level(player.xp)}</Pill>
              <Pill>✨ {player.xp} XP</Pill>
            </div>
            <p className="mb-1 text-sm font-bold text-muted">{title(player.xp)} · próximo nível</p>
            <ProgressBar value={levelProgress(player.xp)} />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col items-start gap-3 border-brand/40 sm:flex-row sm:items-center">
        <div className="text-5xl">{subject.practice.icon}</div>
        <div className="flex-1">
          <h2 className="text-xl font-black">{subject.practice.title}</h2>
          <p className="text-muted">{subject.practice.text}</p>
        </div>
        <Button size="lg" onClick={() => onNavigate('atlas')}>Abrir {subject.practice.nav} ➜</Button>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-black">🎯 Teoria por sistema <span className="text-sm font-semibold text-muted">· {total} questões</span></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((s) => (
            <button
              key={s.id}
              onClick={() => onPlay(s.id)}
              className="group rounded-3xl border border-line bg-card p-4 text-left transition hover:-translate-y-1 hover:border-brand hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl transition group-hover:scale-110">{s.icon}</span>
                <Stars n={player.stars[s.id] || 0} />
              </div>
              <h3 className="mt-2 font-black">{s.name}</h3>
              <p className="text-sm text-muted">
                {s.total} questões{s.open ? ` (${s.open} discursivas)` : ''} · recorde {player.best[s.id] || 0} pts
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className={`grid gap-3 ${openTotal ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <Card className="flex flex-col gap-2">
          <span className="text-3xl">🔥</span>
          <h3 className="font-black">Simulado geral</h3>
          <p className="flex-1 text-sm text-muted">40 questões objetivas sorteadas de todos os sistemas.</p>
          <Button onClick={() => onPlay('all')}>Jogar</Button>
        </Card>
        {openTotal > 0 && (
          <Card className="flex flex-col gap-2 border-gold/50">
            <span className="text-3xl">✍️</span>
            <h3 className="font-black">Explique com suas palavras</h3>
            <p className="flex-1 text-sm text-muted">{openTotal} questões discursivas para descrever e diferenciar conceitos.</p>
            <Button variant="warn" onClick={() => onPlay('open')}>Treinar</Button>
          </Card>
        )}
        <Card className="flex flex-col gap-2">
          <span className="text-3xl">🔁</span>
          <h3 className="font-black">Revisar erros</h3>
          <p className="flex-1 text-sm text-muted">{player.wrong.length ? `${player.wrong.length} questões esperando você.` : 'Nenhum erro guardado. 👏'}</p>
          <Button variant="secondary" disabled={!player.wrong.length} onClick={() => onPlay('review')}>Revisar</Button>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-3xl">🃏</span>
          <h3 className="font-black">Flashcards</h3>
          <p className="flex-1 text-sm text-muted">Estude no seu ritmo, sem tempo e sem vidas.</p>
          <Button variant="secondary" onClick={() => onNavigate('flash')}>Estudar</Button>
        </Card>
      </section>

      <div className="flex flex-col items-center gap-2 pb-6 text-center text-sm text-muted">
        <p>3 vidas ❤️ · objetivas 25s · discursivas 2min30 · acertos seguidos multiplicam os pontos</p>
        <Button variant="ghost" size="sm" onClick={onReset}>♻️ Zerar meu progresso em {subject.name}</Button>
      </div>
    </div>
  );
}
