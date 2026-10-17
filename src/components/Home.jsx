import { useMemo } from 'react';
import { api } from '../lib/api.js';
import { Button, Card, MascotTalk, Pill, ProgressBar, Stars } from './ui.jsx';
import { level, levelProgress, title } from '../lib/progress.js';
import { PHRASES, pick } from '../lib/phrases.js';

export default function Home({ player, subject, systems, onPlay, onNavigate, onReset }) {
  const total = systems.reduce((s, x) => s + x.total, 0);
  const counts = api.counts();
  const greet = useMemo(() => pick(PHRASES.greet(player.name.split(' ')[0], subject.name)), [player.name, subject.name]);
  const bestExam = player.best.exam ? (player.best.exam / 100).toFixed(1).replace('.', ',') : null;
  const pastParts = [counts.prova && `${counts.prova} da prova`, counts.quiz && `${counts.quiz} do quiz`, counts.ed && `${counts.ed} dos estudos dirigidos`].filter(Boolean).join(', ');

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

      <section className="grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col gap-2 border-accent/40 bg-gradient-to-br from-accent/10 via-card to-card">
          <div className="flex items-center justify-between">
            <span className="text-4xl">📝</span>
            {bestExam && <Pill className="bg-accent/15 text-accent">Melhor nota: {bestExam}</Pill>}
          </div>
          <h2 className="text-xl font-black">Simulado de prova</h2>
          <p className="flex-1 text-muted">Objetivas, discursivas e identificação por imagem, com tempo de prova e nota de 0 a 10. Pode priorizar as questões que já caíram.</p>
          <Button variant="accent" size="lg" onClick={() => onNavigate('exam')}>Fazer simulado ➜</Button>
        </Card>
        <Card className="flex flex-col gap-2 border-brand/40 bg-gradient-to-br from-brand/10 via-card to-card">
          <span className="text-4xl">🧠</span>
          <h2 className="text-xl font-black">Mapa mental de {subject.name}</h2>
          <p className="flex-1 text-muted">Todo o conteúdo em ramos, com imagens. Abra, feche, pesquise e treine cada tema direto do mapa.</p>
          <Button size="lg" onClick={() => onNavigate('mindmap')}>Abrir mapa mental ➜</Button>
        </Card>
      </section>

      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="text-5xl">{subject.practice.icon}</div>
        <div className="flex-1">
          <h2 className="text-xl font-black">{subject.practice.title}</h2>
          <p className="text-muted">{subject.practice.text}</p>
        </div>
        <Button size="lg" variant="secondary" onClick={() => onNavigate('atlas')}>Abrir {subject.practice.nav} ➜</Button>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-black">🎯 Teoria por tema <span className="text-sm font-semibold text-muted">· {total} questões</span></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((s) => (
            <button key={s.id} onClick={() => onPlay(s.id)}
              className="group rounded-3xl border border-line bg-card p-4 text-left transition hover:-translate-y-1 hover:border-brand hover:shadow-lg">
              <div className="flex items-start justify-between">
                <span className="text-4xl transition group-hover:scale-110">{s.icon}</span>
                <Stars n={player.stars[s.id] || 0} />
              </div>
              <h3 className="mt-2 font-black">{s.name}</h3>
              <p className="text-sm text-muted">{s.total} questões{s.open ? ` (${s.open} discursivas)` : ''} · recorde {player.best[s.id] || 0} pts</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {counts.past > 0 && (
          <Card className="flex flex-col gap-2 border-accent/40">
            <span className="text-3xl">📄</span>
            <h3 className="font-black">Questões que já caíram</h3>
            <p className="flex-1 text-sm text-muted">{counts.past} questões ({pastParts}).</p>
            <Button variant="accent" onClick={() => onPlay('past')}>Treinar</Button>
          </Card>
        )}
        {counts.open > 0 && (
          <Card className="flex flex-col gap-2 border-gold/50">
            <span className="text-3xl">✍️</span>
            <h3 className="font-black">Explique com suas palavras</h3>
            <p className="flex-1 text-sm text-muted">{counts.open} questões discursivas para descrever e diferenciar conceitos.</p>
            <Button variant="warn" onClick={() => onPlay('open')}>Treinar</Button>
          </Card>
        )}
        <Card className="flex flex-col gap-2">
          <span className="text-3xl">🔥</span>
          <h3 className="font-black">Simulado relâmpago</h3>
          <p className="flex-1 text-sm text-muted">40 objetivas com tempo, vidas e combo.</p>
          <Button onClick={() => onPlay('all')}>Jogar</Button>
        </Card>
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
