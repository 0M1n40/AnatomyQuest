import Mascot from './Mascot.jsx';
import { level } from '../lib/progress.js';

const NAV = [
  { id: 'home', icon: '🏠', label: 'Início' },
  { id: 'atlas', icon: '🖼️', label: 'Atlas' },
  { id: 'flash', icon: '🃏', label: 'Flashcards' },
  { id: 'ranking', icon: '🏅', label: 'Ranking' },
];

export default function Header({ player, current, onNavigate, theme, onToggleTheme, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
        <button onClick={() => player && onNavigate('home')} className="flex items-center gap-1.5">
          <Mascot size={34} />
          <span className="hidden text-lg font-black tracking-tight sm:inline">
            Anatomia<span className="text-brand">Quest</span>
          </span>
        </button>

        {player ? (
          <nav className="ml-2 flex flex-1 gap-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => onNavigate(n.id)}
                className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${current === n.id ? 'bg-brand text-brand-ink' : 'text-muted hover:bg-soft hover:text-ink'}`}
              >
                <span>{n.icon}</span><span className="ml-1 hidden md:inline">{n.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="flex-1" />
        )}

        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="relative flex h-9 w-16 items-center rounded-full border border-line bg-soft px-1 transition"
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-card text-sm shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : ''}`}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>

        {player && (
          <div className="flex items-center gap-1">
            <span className="hidden rounded-full bg-soft px-3 py-1 text-sm font-bold sm:inline">
              {player.name} · Nv {level(player.xp)}
            </span>
            <button onClick={onLogout} title="Trocar jogador" className="rounded-xl px-2 py-1.5 text-muted hover:bg-soft hover:text-ink">🚪</button>
          </div>
        )}
      </div>
    </header>
  );
}
