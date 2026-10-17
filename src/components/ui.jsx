import Mascot from './Mascot.jsx';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-3xl border border-line bg-card p-5 shadow-sm shadow-slate-900/5 dark:shadow-black/30 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-brand-ink hover:brightness-110 shadow-sm',
    secondary: 'bg-soft text-ink hover:bg-line',
    accent: 'bg-accent text-white hover:brightness-110 shadow-sm',
    ghost: 'text-muted hover:bg-soft hover:text-ink',
    success: 'bg-emerald-500 text-white hover:brightness-110',
    warn: 'bg-gold text-slate-900 hover:brightness-110',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5', lg: 'px-6 py-3 text-lg' };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function Pill({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-sm font-bold ${className}`}>{children}</span>;
}

export function Tag({ children }) {
  return <span className="inline-block rounded-lg bg-brand/15 px-2.5 py-0.5 text-xs font-extrabold text-brand">{children}</span>;
}

export function ProgressBar({ value, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-gradient-to-r from-brand to-sky-400',
    gold: 'bg-gradient-to-r from-gold to-orange-400',
    danger: 'bg-gradient-to-r from-accent to-orange-400',
  };
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-soft ${className}`}>
      <div className={`h-full rounded-full ${tones[tone]} transition-all duration-200`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Stars({ n = 0, size = 'text-base' }) {
  return <span className={`tracking-widest text-gold ${size}`}>{'★'.repeat(n)}<span className="opacity-30">{'★'.repeat(3 - n)}</span></span>;
}

export function Spinner({ label = 'Carregando…' }) {
  return (
    <div className="flex flex-col items-center py-12 text-muted">
      <Mascot mood="think" size={90} className="animate-float" />
      <p className="mt-2 animate-pulse font-semibold">{label}</p>
    </div>
  );
}

export function MascotTalk({ mood = 'happy', text, size = 110, className = '' }) {
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Mascot mood={mood} size={size} className="shrink-0 animate-float drop-shadow-md" />
      {text && (
        <div key={text} className="relative mb-6 animate-bounce-in rounded-2xl border border-line bg-card px-4 py-3 text-sm font-semibold shadow-sm">
          {text}
          <span className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 border-b border-l border-line bg-card" />
        </div>
      )}
    </div>
  );
}

export const optionClass = (state) => ({
  idle: 'border-line bg-soft/60 hover:border-brand hover:bg-brand/5',
  selected: 'border-brand bg-brand/10',
  hidden: 'pointer-events-none opacity-25 border-line bg-soft/60',
  correct: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  wrong: 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100',
  dim: 'border-line bg-soft/40 opacity-60',
}[state]);

const FEEDBACK = {
  correct: ['✅ Correto! ', 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'],
  partial: ['🟡 Parcialmente correto. ', 'border-gold bg-gold/10'],
  wrong: ['❌ Não foi dessa vez. ', 'border-rose-500 bg-rose-50 dark:bg-rose-950/50'],
};

export function Feedback({ result, timeout, children }) {
  const kind = typeof result === 'string' ? result : result.correct ? 'correct' : 'wrong';
  const [label, tone] = FEEDBACK[kind];
  return (
    <div className={`mt-4 animate-bounce-in rounded-2xl border-l-4 p-4 leading-relaxed ${tone}`}>
      <b>{timeout && kind !== 'correct' ? '⏰ Tempo esgotado! ' : label}</b>
      {children}
    </div>
  );
}
