import { useState } from 'react';
import { Button, Card, MascotTalk } from './ui.jsx';

export default function Login({ onLogin, error }) {
  const [name, setName] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onLogin(name.trim());
  };
  return (
    <div className="mx-auto mt-10 max-w-md">
      <MascotTalk size={140} text="Olá! Eu sou o Doutor Ossinho, seu parceiro de estudos na Enfermagem. Como posso te chamar?" className="mb-2" />
      <Card>
        <h1 className="text-3xl font-black">Nurse<span className="text-brand">Hub</span></h1>
        <p className="mb-4 text-muted">Estudo gamificado para Enfermagem: simulados, mapas mentais, questões discursivas e prova prática.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome ou apelido"
            className="w-full rounded-2xl border-2 border-line bg-soft px-4 py-3 font-semibold outline-none transition focus:border-brand"
          />
          {error && <p className="text-sm font-semibold text-accent">{error}</p>}
          <Button className="w-full" size="lg" disabled={!name.trim()}>Entrar ➜</Button>
        </form>
        <p className="mt-3 text-center text-xs text-muted">Seu progresso fica salvo neste navegador.</p>
      </Card>
    </div>
  );
}
