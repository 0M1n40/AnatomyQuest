import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { SYSTEM_LABEL } from '../../lib/progress.js';
import { Button, Card, MascotTalk, Spinner } from '../ui.jsx';
import AtlasViewer from './AtlasViewer.jsx';

const input = 'w-full rounded-xl border-2 border-line bg-soft px-3 py-2 font-semibold outline-none focus:border-brand';

// Lê a imagem e reduz para no máx. 1200px (fica leve para salvar no navegador e no GitHub)
function readImage(file, max = 1200) {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/')) return reject(new Error('Escolha um arquivo de imagem (PNG, JPG…).'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    img.src = url;
  });
}

function downloadAtlas() {
  const blob = new Blob([api.atlas.exportJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'atlas.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function Gate({ onOk, onBack }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await api.atlas.auth(pin); onOk(pin); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="mx-auto max-w-md space-y-3">
      <MascotTalk mood="think" size={100} text="Área da professora! Qual é a senha? 🔐" />
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <input type="password" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Senha do editor" className={input} />
          {err && <p className="text-sm font-semibold text-accent">{err}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onBack}>Voltar</Button>
            <Button className="flex-1">Entrar</Button>
          </div>
          <p className="text-xs text-muted">Padrão: <b>anatomia</b>. Pode ser trocada pelo secret <code>PROF_PIN</code> no GitHub.</p>
        </form>
      </Card>
    </div>
  );
}

export default function AtlasEditor({ onBack }) {
  const [pin, setPin] = useState(null);
  const [figures, setFigures] = useState(null);
  const [fig, setFig] = useState(null);
  const [sel, setSel] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', system: 'resp', file: null });
  const [, setTick] = useState(0);

  const loadList = () => api.atlas.figures().then((f) => { setFigures(f); setTick((t) => t + 1); });
  useEffect(() => { if (pin) loadList(); }, [pin]);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 4000); };
  const guard = () => !dirty || confirm('Há alterações não salvas. Descartar?');

  const open = async (id) => {
    if (!guard()) return;
    setFig(await api.atlas.figure(id));
    setSel(null);
    setDirty(false);
  };

  const patch = (changes) => { setFig((f) => ({ ...f, ...changes })); setDirty(true); };
  const patchPin = (id, changes) => patch({ pins: fig.pins.map((p) => (p.id === id ? { ...p, ...changes } : p)) });

  const addPin = ({ x, y }) => {
    const id = `new-${Date.now()}`;
    patch({ pins: [...fig.pins, { id, label: '', explanation: '', x, y }] });
    setSel(id);
  };
  const removePin = (id) => { patch({ pins: fig.pins.filter((p) => p.id !== id) }); setSel(null); };

  const save = async () => {
    const unnamed = fig.pins.filter((p) => !p.label.trim()).length;
    if (unnamed && !confirm(`${unnamed} ponto(s) sem nome serão descartados. Continuar?`)) return;
    setBusy(true);
    try {
      const saved = await api.atlas.update(pin, fig.id, { title: fig.title, system: fig.system, pins: fig.pins });
      setFig(saved); setSel(null); setDirty(false);
      await loadList();
      flash('✅ Salvo neste navegador. Exporte o atlas.json para publicar.');
    } catch (e) { flash('❌ ' + e.message); } finally { setBusy(false); }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!guard()) return;
    const formEl = e.currentTarget;
    setBusy(true);
    try {
      const imageData = await readImage(form.file);
      const created = await api.atlas.create(pin, { title: form.title, system: form.system, imageData, pins: [] });
      await loadList();
      setFig(created); setSel(null); setDirty(false);
      setForm({ title: '', system: form.system, file: null });
      formEl.reset();
      flash('✅ Imagem adicionada! Agora clique nela para marcar as estruturas.');
    } catch (x) { flash('❌ ' + x.message); } finally { setBusy(false); }
  };

  const replaceImage = async (file) => {
    setBusy(true);
    try {
      const saved = await api.atlas.update(pin, fig.id, { imageData: await readImage(file) });
      setFig((f) => ({ ...f, image: saved.image }));
      await loadList();
      flash('✅ Imagem substituída.');
    } catch (x) { flash('❌ ' + x.message); } finally { setBusy(false); }
  };

  const removeFigure = async () => {
    if (!confirm(`Excluir a figura "${fig.title}"?`)) return;
    try {
      await api.atlas.remove(pin, fig.id);
      setFig(null); setDirty(false);
      await loadList();
      flash('🗑️ Figura excluída.');
    } catch (x) { flash('❌ ' + x.message); }
  };

  const restore = async () => {
    if (!confirm('Descartar TODAS as alterações feitas neste navegador e voltar ao atlas publicado?')) return;
    await api.atlas.restore();
    setFig(null); setDirty(false);
    await loadList();
    flash('↩️ Atlas restaurado.');
  };

  if (!pin) return <Gate onOk={setPin} onBack={onBack} />;
  if (!figures) return <Spinner />;

  const current = fig?.pins.find((p) => p.id === sel);
  const changed = api.atlas.hasLocalChanges();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => guard() && onBack()}>⟵ Atlas</Button>
        <h1 className="flex-1 text-xl font-black">✏️ Editor do Atlas</h1>
        {msg && <span className="animate-bounce-in rounded-xl bg-soft px-3 py-1 text-sm font-bold">{msg}</span>}
      </div>

      <Card className="flex flex-col gap-3 border-gold/50 bg-gold/10 p-4 md:flex-row md:items-center">
        <p className="flex-1 text-sm font-semibold">
          📌 As alterações ficam salvas <b>só neste navegador</b>. Para os alunos verem, clique em <b>Exportar atlas.json</b>,
          substitua o arquivo <code>src/data/atlas.json</code> do projeto e envie para o GitHub.
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled={!changed || dirty} onClick={downloadAtlas}>⬇️ Exportar atlas.json</Button>
          <Button size="sm" variant="secondary" disabled={!changed} onClick={restore}>↩️ Restaurar</Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-2 font-black">➕ Nova figura</h2>
            <form onSubmit={create} className="space-y-2">
              <input required placeholder="Título (ex.: Peça – estômago)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
              <select value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} className={input}>
                {Object.entries(SYSTEM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input required type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} className="w-full text-sm" />
              <Button className="w-full" disabled={busy}>{busy ? 'Processando…' : 'Adicionar imagem'}</Button>
            </form>
            <p className="mt-2 text-xs text-muted">Dica: use fotos das peças do laboratório. O navegador guarda cerca de 10 a 15 fotos.</p>
          </Card>

          <Card className="max-h-[55vh] overflow-auto p-3">
            <h2 className="mb-2 px-1 font-black">Figuras</h2>
            {figures.map((f) => (
              <button
                key={f.id}
                onClick={() => open(f.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-xl p-1.5 text-left text-sm font-semibold transition ${fig?.id === f.id ? 'bg-brand/15' : 'hover:bg-soft'}`}
              >
                <img src={f.image} alt="" className="h-10 w-10 rounded-lg bg-white object-contain" />
                <span className="flex-1 leading-tight">{f.title}<br /><small className="text-muted">{f.pinCount} pontos{f.builtin ? ' · padrão' : ''}</small></span>
              </button>
            ))}
          </Card>
        </div>

        {!fig ? (
          <Card className="flex items-center justify-center">
            <MascotTalk mood="happy" size={100} text="Escolha uma figura ao lado ou adicione uma nova imagem. Depois é só clicar nela para marcar as estruturas! 📌" />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-2">
              <p className="rounded-2xl bg-soft px-3 py-2 text-sm font-semibold">
                🖱️ <b>Clique na imagem</b> para criar um ponto · <b>arraste</b> um ponto para reposicionar · clique em um ponto para editar.
              </p>
              <AtlasViewer
                image={fig.image}
                alt={fig.title}
                editable
                onImageClick={addPin}
                onPinClick={(p) => setSel(p.id)}
                onPinMove={(id, xy) => patchPin(id, xy)}
                pins={fig.pins.map((p, i) => ({ ...p, number: i + 1, state: p.id === sel ? 'selected' : p.label.trim() ? 'idle' : 'wrong', showLabel: true }))}
              />
            </div>

            <div className="space-y-3">
              <Card className="space-y-2 p-4">
                <label className="text-xs font-black text-muted">TÍTULO</label>
                <input value={fig.title} onChange={(e) => patch({ title: e.target.value })} className={input} />
                <label className="text-xs font-black text-muted">SISTEMA</label>
                <select value={fig.system} onChange={(e) => patch({ system: e.target.value })} className={input}>
                  {Object.entries(SYSTEM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {!fig.builtin && (
                  <label className="block cursor-pointer text-sm font-bold text-brand">
                    🔄 Trocar imagem
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && replaceImage(e.target.files[0])} />
                  </label>
                )}
              </Card>

              <Card className="space-y-2 p-4">
                {current ? (
                  <>
                    <p className="text-xs font-black text-muted">PONTO {fig.pins.indexOf(current) + 1}</p>
                    <input autoFocus placeholder="Nome da estrutura *" value={current.label} onChange={(e) => patchPin(current.id, { label: e.target.value })} className={input} />
                    <textarea rows={3} placeholder="Explicação (aparece após a resposta)" value={current.explanation} onChange={(e) => patchPin(current.id, { explanation: e.target.value })} className={input} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSel(null)}>OK</Button>
                      <Button size="sm" variant="accent" onClick={() => removePin(current.id)}>🗑️ Remover ponto</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-muted">{fig.pins.length} ponto(s). Clique em um ponto para editar ou na imagem para criar.</p>
                )}
              </Card>

              <div className="flex gap-2">
                <Button className="flex-1" disabled={!dirty || busy} onClick={save}>{busy ? 'Salvando…' : '💾 Salvar'}</Button>
                {!fig.builtin && <Button variant="secondary" onClick={removeFigure}>Excluir</Button>}
              </div>
              {dirty && <p className="text-center text-xs font-bold text-gold">Alterações não salvas</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
