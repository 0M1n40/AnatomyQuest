import Mascot from './Mascot.jsx';
import { level } from '../lib/progress.js';

export default function Header({ player, subject, current, onNavigate, onSubjects, theme, onToggleTheme, onLogout }) {
  const nav = subject
    ? [
        { id: 'home', icon: '🏠', label: 'Início' },
        { id: 'atlas', icon: subject.practice.icon, label: subject.practice.nav },
        { id: 'mindmap', icon: '🧠', label: 'Mapa mental' },
        { id: 'exam', icon: '📝', label: 'Simulado' },
        { id: 'flash', icon: '🃏', label: 'Flashcards' },
        { id: 'ranking', icon: '🏅', label: 'Ranking' },
      ]
    : [];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        <button onClick={() => player && onSubjects()} className="flex items-center gap-1.5" title="Escolher matéria">
          <Mascot size={34} />
          <span className="hidden text-lg font-black tracking-tight sm:inline">Nurse<span className="text-brand">Hub</span></span>
        </button>
        {player && subject && (
          <button onClick={onSubjects} title="Trocar de matéria"
            className="ml-1 flex shrink-0 items-center gap-1 rounded-xl border border-line bg-soft px-2.5 py-1.5 text-sm font-black transition hover:border-brand">
            {subject.icon}<span className="hidden sm:inline">{subject.name}</span><span className="text-muted">▾</span>
          </button>
        )}
        <nav className="ml-1 flex flex-1 gap-0.5 overflow-x-auto">
          {player && nav.map((n) => (
            <button key={n.id} onClick={() => onNavigate(n.id)} title={n.label}
              className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-bold transition ${current === n.id ? 'bg-brand text-brand-ink' : 'text-muted hover:bg-soft hover:text-ink'}`}>
              <span>{n.icon}</span><span className="ml-1 hidden lg:inline">{n.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={onToggleTheme} title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="relative flex h-9 w-16 shrink-0 items-center rounded-full border border-line bg-soft px-1 transition">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-card text-sm shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : ''}`}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
        {player && (
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden rounded-full bg-soft px-3 py-1 text-sm font-bold xl:inline">{player.name} · Nv {level(player.xp)}</span>
            <button onClick={onLogout} title="Trocar jogador" className="rounded-xl px-2 py-1.5 text-muted hover:bg-soft hover:text-ink">🚪</button>
          </div>
        )}
      </div>
    </header>
  );
}
