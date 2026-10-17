import { Button, Feedback } from './ui.jsx';

export function OpenInput({ text, setText, keyCount, hint, autoFocus = true }) {
  return (
    <div className="space-y-2">
      <textarea autoFocus={autoFocus} rows={6} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Escreva sua resposta aqui, com suas palavras…"
        className="w-full rounded-2xl border-2 border-line bg-soft p-4 font-semibold leading-relaxed outline-none transition focus:border-brand" />
      {hint && <div className="rounded-2xl border-l-4 border-gold bg-gold/10 p-3">💡 <b>Dica:</b> {hint}</div>}
      <p className="text-xs font-bold text-muted">{text.trim().split(/\s+/).filter(Boolean).length} palavras · {keyCount} pontos-chave esperados</p>
    </div>
  );
}

// Resposta do aluno × modelo + pontos-chave + autoavaliação
export function OpenReview({ review, graded, onGrade, timeout }) {
  const { keyPoints, found, total, model, suggested, answer } = review;
  return (
    <div className="space-y-3">
      {timeout && <p className="text-sm font-bold text-accent">⏰ O tempo acabou — conferimos o que você escreveu.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-soft p-4">
          <p className="mb-1 text-xs font-black text-muted">SUA RESPOSTA</p>
          <p className="whitespace-pre-wrap font-semibold">{answer || <i className="text-muted">(em branco)</i>}</p>
        </div>
        <div className="rounded-2xl bg-brand/10 p-4">
          <p className="mb-1 text-xs font-black text-brand">RESPOSTA MODELO</p>
          <p className="font-semibold leading-relaxed">{model}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-line p-4">
        <p className="mb-2 text-sm font-black">🔑 Pontos-chave ({found}/{total} identificados automaticamente)</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {keyPoints.map((k) => (
            <li key={k.label} className={`flex items-start gap-2 rounded-xl px-2 py-1 text-sm font-semibold ${k.found ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <span>{k.found ? '✅' : '⬜'}</span>{k.label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">A conferência automática procura palavras-chave e pode errar. Use a resposta modelo para se autoavaliar com honestidade.</p>
      </div>
      {!graded ? (
        <div className="rounded-2xl bg-soft p-4">
          <p className="mb-2 font-black">Como foi sua resposta? <span className="text-sm font-semibold text-muted">(sugestão: {suggested === 'correct' ? 'acertei' : suggested === 'partial' ? 'parcial' : 'errei'})</span></p>
          <div className="flex flex-wrap gap-2">
            <Button variant="success" onClick={() => onGrade('correct')}>✅ Acertei</Button>
            <Button variant="warn" onClick={() => onGrade('partial')}>🟡 Parcial</Button>
            <Button variant="accent" onClick={() => onGrade('wrong')}>❌ Errei</Button>
          </div>
        </div>
      ) : (
        <Feedback result={graded}>{graded === 'correct' ? 'Ótima explicação!' : graded === 'partial' ? 'Revise os pontos que faltaram.' : 'Releia a resposta modelo e tente explicar de novo depois.'}</Feedback>
      )}
    </div>
  );
}

export default function OpenQuestion({ q, text, setText, review, onSubmit, onGrade, graded, timeout, hint }) {
  if (!review) {
    return (
      <div className="space-y-3">
        <OpenInput text={text} setText={setText} keyCount={q.keyCount} hint={hint} />
        <div className="flex justify-end">
          <Button onClick={() => onSubmit(text)} disabled={text.trim().length < 3}>Conferir resposta ➜</Button>
        </div>
      </div>
    );
  }
  return <OpenReview review={review} graded={graded} onGrade={onGrade} timeout={timeout} />;
}
