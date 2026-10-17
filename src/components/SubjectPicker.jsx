import { api } from '../lib/api.js';
import { Card, MascotTalk, Pill } from './ui.jsx';

export default function SubjectPicker({ player, current, onPick }) {
  const subjects = api.subjects();
  return (
    <div className="space-y-5">
      <MascotTalk mood="happy" size={110} text={`${player.name.split(' ')[0]}, qual matéria vamos estudar hoje? 📚`} />
      <h1 className="text-2xl font-black">Escolha a matéria</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <button key={s.id} onClick={() => onPick(s.id)} className="text-left">
            <Card className={`h-full transition hover:-translate-y-1 hover:border-brand hover:shadow-lg ${current === s.id ? 'border-brand' : ''}`}>
              <div className="flex items-start justify-between">
                <span className="text-6xl">{s.icon}</span>
                {current === s.id && <Pill className="bg-brand/15 text-brand">Atual</Pill>}
              </div>
              <h2 className="mt-3 text-2xl font-black">{s.name}</h2>
              <p className="mt-1 text-muted">{s.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>📝 {s.total} questões</Pill>
                {s.open > 0 && <Pill>✍️ {s.open} discursivas</Pill>}
                {s.past > 0 && <Pill>📄 {s.past} da prova/quiz/ED</Pill>}
                <Pill>🖼️ {s.figures} imagens</Pill>
                <Pill>🧠 Mapa mental</Pill>
              </div>
            </Card>
          </button>
        ))}
        <Card className="flex flex-col items-center justify-center border-dashed text-center text-muted">
          <span className="text-4xl">➕</span>
          <p className="mt-2 font-bold">Mais matérias em breve</p>
          <p className="text-sm">Cada nova matéria já vem com mapa mental e simulado de prova.</p>
        </Card>
      </div>
    </div>
  );
}
