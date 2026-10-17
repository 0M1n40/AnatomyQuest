import { useRef } from 'react';

const PIN_STYLE = {
  idle: 'bg-brand text-brand-ink ring-white hover:scale-125',
  study: 'bg-sky-500 text-white ring-white hover:scale-125',
  selected: 'bg-gold text-slate-900 ring-white scale-125',
  correct: 'bg-emerald-500 text-white ring-white scale-125',
  wrong: 'bg-rose-500 text-white ring-white scale-110',
  dim: 'bg-slate-400/70 text-white ring-white/70 scale-90',
};

/**
 * Imagem com marcadores posicionados em % (funciona em qualquer tamanho de tela).
 * pins: [{ id, x, y, number?, label?, state?, showLabel? }]
 * target: { x, y, state?, label? } → ponteiro "a professora está apontando aqui"
 */
export default function AtlasViewer({ image, alt = 'Figura', pins = [], target, onPinClick, onImageClick, onPinMove, editable = false, className = '' }) {
  const box = useRef(null);
  const drag = useRef(null);

  const toPercent = (e) => {
    const r = box.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };

  return (
    <div ref={box} className={`relative mx-auto w-full select-none overflow-hidden rounded-3xl border border-line bg-white shadow-inner ${className}`}>
      <img src={image} alt={alt} draggable={false} onClick={(e) => onImageClick?.(toPercent(e))} className={`block h-auto w-full ${onImageClick ? 'cursor-crosshair' : ''}`} />

      {target && (
        <div className="pointer-events-none absolute" style={{ left: `${target.x}%`, top: `${target.y}%` }}>
          {!target.state && <span className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-accent/40" />}
          <span className={`absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 ${target.state === 'correct' ? 'border-emerald-500' : target.state === 'wrong' ? 'border-rose-500' : 'border-accent'} bg-white/30`} />
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-white" />
          <svg className="absolute h-16 w-16 drop-shadow" style={{ left: 8, top: -70 }} viewBox="0 0 64 64">
            <path d="M6 58 L52 10" stroke="#7c4a2d" strokeWidth="6" strokeLinecap="round" />
            <path d="M6 58 L16 46" stroke="#f43f5e" strokeWidth="7" strokeLinecap="round" />
          </svg>
          {target.label && <span className="absolute left-5 top-3 whitespace-nowrap rounded-xl bg-slate-900/85 px-2.5 py-1 text-xs font-bold text-white shadow">{target.label}</span>}
        </div>
      )}

      {pins.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={(e) => { e.stopPropagation(); onPinClick?.(p); }}
          onPointerDown={(e) => { if (!editable) return; e.stopPropagation(); drag.current = p.id; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (editable && drag.current === p.id) onPinMove?.(p.id, toPercent(e)); }}
          onPointerUp={() => { drag.current = null; }}
          className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-black shadow-md ring-2 transition ${PIN_STYLE[p.state || 'idle']} ${editable ? 'cursor-grab touch-none active:cursor-grabbing' : onPinClick ? 'cursor-pointer' : 'pointer-events-none'}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          title={p.showLabel ? p.label : undefined}
        >
          {p.number ?? ''}
          {p.showLabel && p.label && <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900/85 px-2 py-0.5 text-[11px] font-bold text-white">{p.label}</span>}
        </button>
      ))}
    </div>
  );
}
