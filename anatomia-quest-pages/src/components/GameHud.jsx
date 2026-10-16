import { Button, Pill, ProgressBar } from './ui.jsx';
import { TIME, multiplier } from '../hooks/useGameEngine.js';

export default function GameHud({ engine, idx, total, onExit }) {
  const { lives, points, combo, time, unlimitedLives } = engine;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onExit}>⟵ Sair</Button>
        <div className="flex-1" />
        <Pill>{unlimitedLives ? '🔁 Treino' : '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(3 - Math.max(0, lives))}</Pill>
        <Pill>🏅 {points}</Pill>
        {combo > 1 && <Pill className="bg-gold/20 text-gold">🔥 x{multiplier(combo)}</Pill>}
        <Pill>{Math.min(idx + 1, total)}/{total}</Pill>
      </div>
      <ProgressBar value={(idx / total) * 100} />
      <div className="flex items-center gap-2">
        <span className="w-10 text-right text-xs font-black text-muted">{Math.ceil(time)}s</span>
        <ProgressBar className="flex-1" value={(time / TIME) * 100} tone={time < 8 ? 'danger' : 'gold'} />
      </div>
    </div>
  );
}
