import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { normalize } from '../lib/text.js';
import { PHRASES, pick } from '../lib/phrases.js';
import { Button, Card, MascotTalk, Pill } from './ui.jsx';
import AtlasViewer from './atlas/AtlasViewer.jsx';

const COLORS = ['#0d9488', '#f43f5e', '#8b5cf6', '#f59e0b', '#0ea5e9', '#22c55e', '#ec4899', '#64748b'];

// Gera caminhos ("0", "0.2", "0.2.1"…) para cada nó
function index(node, path = '0', out = []) {
  out.push({ path, node });
  (node.children || []).forEach((c, i) => index(c, `${path}.${i}`, out));
  return out;
}

// Imagens de um nó: "image" (caminho/URL) e/ou "figures" (ids do Atlas/Laminário/Esquemas)
function nodeImages(node, figMap) {
  const out = [];
  if (node.image) out.push({ key: node.image, image: node.image, title: node.label, pins: [] });
  for (const id of node.figures || []) {
    const f = figMap.get(id);
    if (f) out.push({ key: id, image: f.image, title: f.title, pins: f.pins, organ: f.organ, justification: f.justification });
  }
  return out;
}

const ancestors = (path) => path.split('.').map((_, i, a) => a.slice(0, i + 1).join('.'));

function Node({ node, path, depth, color, open, toggle, hits, onPlay, figMap, showImages, onZoom }) {
  const kids = node.children || [];
  const isOpen = open.has(path);
  const hit = hits.has(path);
  const c = depth === 0 ? 'var(--c-brand)' : color;
  const imgs = showImages ? nodeImages(node, figMap) : [];
  const box =
    depth === 0 ? 'bg-brand text-brand-ink text-lg font-black px-5 py-3 shadow-lg'
      : depth === 1 ? 'text-white font-black px-4 py-2.5 shadow-md'
        : 'bg-card border-2 font-bold px-3 py-2';

  return (
    <div className={depth > 0 ? 'mm-item py-1.5' : ''} style={{ '--mm-color': c }}>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => kids.length && toggle(path)}
          className={`max-w-[34rem] rounded-2xl text-left leading-snug transition ${box} ${kids.length ? 'cursor-pointer hover:brightness-105' : 'cursor-default'} ${hit ? 'ring-4 ring-gold' : ''}`}
          style={depth === 1 ? { background: c } : depth > 1 ? { borderColor: c } : undefined}>
          {kids.length > 0 && <span className="mr-1.5 inline-block w-3 text-xs opacity-80">{isOpen ? '▾' : '▸'}</span>}
          {node.label}
          {kids.length > 0 && !isOpen && <span className="ml-2 rounded-full bg-black/10 px-1.5 text-xs">{kids.length}</span>}
        </button>
        {node.system && onPlay && (
          <button onClick={() => onPlay(node.system)} className="no-print rounded-xl bg-soft px-2.5 py-1 text-xs font-black text-brand hover:bg-line">🎯 Treinar</button>
        )}
      </div>
      {node.note && <p className="ml-1 mt-1 max-w-xl text-xs font-semibold text-muted">💡 {node.note}</p>}
      {imgs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {imgs.map((im) => (
            <button key={im.key} onClick={() => onZoom(im)} title={`Ampliar: ${im.title}`}
              className="group overflow-hidden rounded-xl border-2 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: c }}>
              <img src={im.image} alt={im.title} loading="lazy" className="h-20 w-28 object-cover transition group-hover:scale-105" />
              <span className="block max-w-28 truncate bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted">🔍 {im.title}</span>
            </button>
          ))}
        </div>
      )}
      {kids.length > 0 && isOpen && (
        <div className="mm-children mt-1">
          {kids.map((k, i) => (
            <Node key={i} node={k} path={`${path}.${i}`} depth={depth + 1} color={depth === 0 ? COLORS[i % COLORS.length] : color}
              open={open} toggle={toggle} hits={hits} onPlay={onPlay} figMap={figMap} showImages={showImages} onZoom={onZoom} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindMap({ subject, onPlay }) {
  const root = useMemo(() => api.mindmap(), [subject.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useMemo(() => index(root), [root]);
  const [open, setOpen] = useState(() => new Set(['0']));
  const [query, setQuery] = useState('');
  const speech = useMemo(() => pick(PHRASES.mindmap), []);
  const [figMap, setFigMap] = useState(new Map());
  const [showImages, setShowImages] = useState(true);
  const [zoom, setZoom] = useState(null);
  const [labels, setLabels] = useState(true);

  useEffect(() => {
    const ids = new Set(all.flatMap(({ node }) => node.figures || []));
    Promise.all([...ids].map((id) => api.atlas.figure(id).catch(() => null)))
      .then((list) => setFigMap(new Map(list.filter(Boolean).map((f) => [f.id, f]))));
  }, [all]);
  const imageCount = all.reduce((n, { node }) => n + nodeImages(node, figMap).length, 0);

  const hits = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2) return new Set();
    return new Set(all.filter(({ node }) => normalize(`${node.label} ${node.note || ''}`).includes(q)).map((x) => x.path));
  }, [query, all]);

  // Ao pesquisar, abre os ramos que levam aos resultados
  const visibleOpen = useMemo(() => {
    if (!hits.size) return open;
    const s = new Set(open);
    hits.forEach((p) => ancestors(p).slice(0, -1).forEach((a) => s.add(a)));
    return s;
  }, [open, hits]);

  const toggle = (p) => setOpen(() => {
    const s = new Set(visibleOpen);
    if (s.has(p)) s.delete(p); else s.add(p);
    return s;
  });
  const expandAll = () => setOpen(new Set(all.filter((x) => x.node.children?.length).map((x) => x.path)));
  const collapse = () => { setOpen(new Set(['0'])); setQuery(''); };
  const level1 = () => setOpen(new Set(['0', ...all.filter((x) => x.path.split('.').length === 2).map((x) => x.path)]));

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <MascotTalk mood="happy" size={90} text={speech} />
        <div className="flex flex-wrap gap-2">
          <Pill>🧩 {all.length} tópicos</Pill>
          {imageCount > 0 && (
            <Button size="sm" variant={showImages ? 'primary' : 'secondary'} onClick={() => setShowImages(!showImages)}>
              🖼️ {showImages ? 'Ocultar' : 'Mostrar'} imagens ({imageCount})
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={level1}>Ver temas</Button>
          <Button size="sm" variant="secondary" onClick={expandAll}>Expandir tudo</Button>
          <Button size="sm" variant="secondary" onClick={collapse}>Recolher</Button>
          <Button size="sm" variant="secondary" onClick={() => { expandAll(); setTimeout(() => window.print(), 300); }}>🖨️ Imprimir</Button>
        </div>
      </div>

      <div className="no-print">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Buscar no mapa (ex.: IgG, MHC, podócito, surfactante)…"
          className="w-full rounded-2xl border-2 border-line bg-card px-4 py-3 font-semibold outline-none focus:border-brand" />
        {query.length >= 2 && <p className="mt-1 text-sm font-bold text-muted">{hits.size ? `${hits.size} resultado(s) destacado(s) em amarelo` : 'Nada encontrado'}</p>}
      </div>

      <Card className="overflow-x-auto">
        <h1 className="mb-3 text-xl font-black">🧠 Mapa mental · {subject.name}</h1>
        <div className="min-w-[36rem]">
          <Node node={root} path="0" depth={0} color={COLORS[0]} open={visibleOpen} toggle={toggle} hits={hits} onPlay={onPlay}
            figMap={figMap} showImages={showImages} onZoom={(im) => { setZoom(im); setLabels(true); }} />
        </div>
      </Card>

      {zoom && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setZoom(null)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="flex-1 text-lg font-black">🖼️ {zoom.title}</h2>
              {zoom.pins.length > 0 && <Button size="sm" variant="secondary" onClick={() => setLabels(!labels)}>{labels ? '🙈 Esconder nomes' : '👁️ Mostrar nomes'}</Button>}
              <Button size="sm" variant="secondary" onClick={() => setZoom(null)}>✕ Fechar</Button>
            </div>
            <AtlasViewer image={zoom.image} alt={zoom.title} pins={zoom.pins.map((p, i) => ({ ...p, number: i + 1, state: 'study', showLabel: labels }))} />
            {zoom.organ && <p className="mt-3 rounded-2xl bg-brand/10 p-3 text-sm font-semibold"><b className="text-brand">{zoom.organ}:</b> {zoom.justification}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
