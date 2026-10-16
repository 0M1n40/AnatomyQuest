// "Backend" local: toda a lógica roda no navegador (versão para GitHub Pages).
// Mantém a mesma interface (funções que retornam Promise) da versão com servidor.
import SYSTEMS from '../data/questions.json';
import ATLAS from '../data/atlas.json';
import { safeStorage } from './progress.js';

const DB_KEY = 'anatomiaQuest:db';
const ATLAS_KEY = 'anatomiaQuest:atlas';
const PROF_PIN = import.meta.env.VITE_PROF_PIN || 'anatomia';

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const wrap = (fn) => (...args) => {
  try {
    return Promise.resolve(clone(fn(...args)));
  } catch (e) {
    return Promise.reject(e);
  }
};

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============ Questões ============
const ALL = SYSTEMS.flatMap((s) => s.questions.map((q) => ({ ...q, system: s.id })));
const Q_BY_ID = new Map(ALL.map((q) => [q.id, q]));
const SYS_BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]));

function toPublic(q) {
  const s = SYS_BY_ID.get(q.system);
  return {
    id: q.id,
    system: { id: s.id, name: s.name, icon: s.icon },
    text: q.text,
    options: shuffle(q.options.map((text, idx) => ({ id: idx, text }))),
  };
}

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hintFor(q) {
  const first = q.explanation.split(/[.;:]/)[0];
  return first.replace(new RegExp(escapeRegex(q.options[q.answer]), 'gi'), '_____') + '…';
}

function findQuestion(id) {
  const q = Q_BY_ID.get(id);
  if (!q) throw new Error('Questão não encontrada.');
  return q;
}

// ============ Jogadores (salvos neste navegador) ============
function loadDb() {
  try {
    return { players: {}, sessions: [], ...JSON.parse(safeStorage.get(DB_KEY) || '{}') };
  } catch {
    return { players: {}, sessions: [] };
  }
}
let db = loadDb();
const saveDb = () => safeStorage.set(DB_KEY, JSON.stringify(db));

const normalizeName = (name = '') => String(name).trim().replace(/\s+/g, ' ').slice(0, 30);
const key = (name) => normalizeName(name).toLowerCase();

function getPlayer(name) {
  const k = key(name);
  if (!k) throw new Error('Informe o nome do jogador.');
  if (!db.players[k]) {
    db.players[k] = { name: normalizeName(name), xp: 0, best: {}, stars: {}, wrong: [], games: 0, createdAt: new Date().toISOString() };
    saveDb();
  }
  return db.players[k];
}

function markAnswer(name, questionId, correct) {
  const p = getPlayer(name);
  const has = p.wrong.includes(questionId);
  if (correct && has) p.wrong = p.wrong.filter((id) => id !== questionId);
  if (!correct && !has) p.wrong.push(questionId);
  saveDb();
}

const NO_RECORD = ['all', 'review', 'atlas-all'];

function saveSession(name, { mode, points = 0, hits = 0, total = 0, maxCombo = 0 }) {
  const p = getPlayer(name);
  points = Math.max(0, Number(points) || 0);
  const pct = total ? Math.round((hits / total) * 100) : 0;
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
  const xp = Math.round(points / 10);
  p.xp += xp;
  p.games += 1;
  if (!NO_RECORD.includes(mode)) {
    p.best[mode] = Math.max(p.best[mode] || 0, points);
    p.stars[mode] = Math.max(p.stars[mode] || 0, stars);
  }
  const session = { player: p.name, mode, points, hits, total, pct, stars, xp, maxCombo, at: new Date().toISOString() };
  db.sessions.push(session);
  if (db.sessions.length > 1000) db.sessions = db.sessions.slice(-1000);
  saveDb();
  return { session, player: p };
}

function ranking(mode = 'xp', limit = 10) {
  if (mode === 'xp') {
    return Object.values(db.players)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((p) => ({ name: p.name, value: p.xp, games: p.games }));
  }
  const best = {};
  for (const s of db.sessions.filter((s) => s.mode === mode)) {
    if (!best[s.player] || s.points > best[s.player].value) best[s.player] = { name: s.player, value: s.points, pct: s.pct };
  }
  return Object.values(best).sort((a, b) => b.value - a.value).slice(0, limit);
}

// ============ Atlas ============
// As figuras vêm de src/data/atlas.json. Edições da professora ficam salvas
// neste navegador até ela exportar o atlas.json e publicá-lo no GitHub.
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const ATLAS_VERSION = hash(JSON.stringify(ATLAS));

function loadFigures() {
  try {
    const saved = JSON.parse(safeStorage.get(ATLAS_KEY));
    // Se o atlas.json publicado mudou, a versão publicada passa a valer
    if (saved?.base === ATLAS_VERSION && Array.isArray(saved.figures)) return saved.figures;
  } catch { /* ignora */ }
  return clone(ATLAS);
}
let figures = loadFigures();

function commitFigures(next) {
  if (!safeStorage.set(ATLAS_KEY, JSON.stringify({ base: ATLAS_VERSION, figures: next }))) {
    throw new Error('Não foi possível salvar no navegador (espaço cheio ou bloqueado). Exporte o atlas.json e remova fotos grandes.');
  }
  figures = next;
}

const getFigure = (id) => {
  const f = figures.find((x) => x.id === id);
  if (!f) throw new Error('Figura não encontrada.');
  return f;
};

const pending = new Map();
function remember(entry) {
  if (pending.size > 2000) pending.clear();
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  pending.set(token, entry);
  return token;
}

function distractors(fig, target, n = 3) {
  const same = shuffle(fig.pins.filter((p) => p.id !== target.id));
  const others = shuffle(figures.filter((f) => f.id !== fig.id).flatMap((f) => f.pins));
  const out = [];
  for (const p of [...same, ...others]) {
    if (out.length >= n) break;
    if (p.label !== target.label && !out.some((o) => o.label === p.label)) out.push(p);
  }
  return out;
}

const publicFigure = (f) => ({ id: f.id, title: f.title, image: f.image });

function buildQuiz(figure = 'all', type = 'mix', limit = 15) {
  const source = figure === 'all' ? figures : [getFigure(figure)];
  const items = shuffle(source.flatMap((f) => f.pins.map((p) => ({ f, p })))).slice(0, limit);
  if (!items.length) throw new Error('Esta figura ainda não tem pontos marcados.');
  return items.map(({ f, p }) => {
    const kind = type === 'mix' ? (Math.random() < 0.6 ? 'name' : 'locate') : type;
    const token = remember({ figureId: f.id, pinId: p.id });
    if (kind === 'locate' && f.pins.length >= 3) {
      return { token, type: 'locate', figure: publicFigure(f), prompt: p.label, pins: shuffle(f.pins).map((x) => ({ id: x.id, x: x.x, y: x.y })) };
    }
    const options = shuffle([p, ...distractors(f, p)]).map((x) => ({ id: x.id, label: x.label }));
    return { token, type: 'name', figure: publicFigure(f), target: { x: p.x, y: p.y }, options };
  });
}

function checkAnswer(token, pinId) {
  const q = pending.get(token);
  if (!q) throw new Error('Questão expirada. Inicie uma nova partida.');
  const fig = getFigure(q.figureId);
  const pin = fig.pins.find((p) => p.id === q.pinId);
  const chosen = fig.pins.find((p) => p.id === pinId);
  const correct = pinId === pin.id || (!!chosen && chosen.label === pin.label);
  return { correct, answerPinId: pin.id, label: pin.label, explanation: pin.explanation || '', x: pin.x, y: pin.y, figureTitle: fig.title };
}

// ---- Editor ----
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const clamp = (n) => Math.max(0, Math.min(100, Math.round((Number(n) || 0) * 100) / 100));
function requireProf(pin) {
  if (pin !== PROF_PIN) throw new Error('Senha da professora incorreta.');
}
function checkImage(dataUrl) {
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(dataUrl || '')) throw new Error('Imagem inválida. Use PNG, JPG, WEBP ou GIF.');
  return dataUrl;
}
const cleanPins = (pins = []) =>
  pins
    .filter((p) => p && String(p.label || '').trim())
    .map((p) => ({
      id: p.id && !String(p.id).startsWith('new') ? String(p.id) : uid('pin'),
      label: String(p.label).trim().slice(0, 80),
      x: clamp(p.x),
      y: clamp(p.y),
      explanation: String(p.explanation || '').trim().slice(0, 400),
    }));

function createFigure({ title, system = 'outros', imageData, pins }) {
  if (!String(title || '').trim()) throw new Error('Informe um título.');
  const fig = { id: uid('fig'), title: String(title).trim().slice(0, 100), system, image: checkImage(imageData), builtin: false, pins: cleanPins(pins) };
  commitFigures([...figures, fig]);
  return fig;
}

function updateFigure(id, { title, system, pins, imageData }) {
  const old = getFigure(id);
  if (imageData && old.builtin) throw new Error('A imagem de uma figura padrão não pode ser trocada. Crie uma nova figura.');
  const fig = { ...old };
  if (title !== undefined) fig.title = String(title).trim().slice(0, 100) || old.title;
  if (system !== undefined) fig.system = system;
  if (pins !== undefined) fig.pins = cleanPins(pins);
  if (imageData) fig.image = checkImage(imageData);
  commitFigures(figures.map((f) => (f.id === id ? fig : f)));
  return fig;
}

function deleteFigure(id) {
  const fig = getFigure(id);
  if (fig.builtin) throw new Error('Figuras padrão não podem ser excluídas (mas podem ser editadas).');
  commitFigures(figures.filter((f) => f.id !== id));
  return null;
}

// ============ Interface usada pelos componentes ============
export const api = {
  systems: wrap(() => SYSTEMS.map((s) => ({ id: s.id, name: s.name, icon: s.icon, total: s.questions.length }))),
  player: wrap((name) => getPlayer(name)),
  resetPlayer: wrap((name) => { delete db.players[key(name)]; saveDb(); return null; }),
  quiz: wrap((player, mode = 'all', limit = 40) => {
    let pool;
    if (mode === 'all') pool = shuffle(ALL).slice(0, limit);
    else if (mode === 'review') pool = shuffle(getPlayer(player).wrong.map((id) => Q_BY_ID.get(id)).filter(Boolean));
    else {
      if (!SYS_BY_ID.has(mode)) throw new Error('Sistema não encontrado.');
      pool = shuffle(ALL.filter((q) => q.system === mode));
    }
    return { mode, questions: pool.map(toPublic) };
  }),
  answer: wrap((player, questionId, optionId) => {
    const q = findQuestion(questionId);
    const correct = Number.isInteger(optionId) && optionId === q.answer;
    markAnswer(player, q.id, correct);
    return { correct, answerId: q.answer, answerText: q.options[q.answer], explanation: q.explanation };
  }),
  fifty: wrap((id) => {
    const q = findQuestion(id);
    return { remove: shuffle(q.options.map((_, i) => i).filter((i) => i !== q.answer)).slice(0, 2) };
  }),
  hint: wrap((id) => ({ hint: hintFor(findQuestion(id)) })),
  flashcards: wrap((system) => {
    const list = system ? ALL.filter((q) => q.system === system) : ALL;
    return shuffle(list).map((q) => {
      const s = SYS_BY_ID.get(q.system);
      return { id: q.id, system: s.name, icon: s.icon, front: q.text, back: q.options[q.answer], explanation: q.explanation };
    });
  }),
  finish: wrap((player, payload) => saveSession(player, payload)),
  ranking: wrap((mode = 'xp') => ranking(mode)),

  atlas: {
    figures: wrap(() => figures.map(({ id, title, system, image, builtin, pins }) => ({ id, title, system, image, builtin: !!builtin, pinCount: pins.length }))),
    figure: wrap((id) => getFigure(id)),
    quiz: wrap((figure, type, limit) => ({ questions: buildQuiz(figure, type, Math.min(Number(limit) || 15, 100)) })),
    answer: wrap((token, pinId) => checkAnswer(token, pinId)),
    auth: wrap((pin) => { requireProf(pin); return { ok: true }; }),
    create: wrap((pin, data) => { requireProf(pin); return createFigure(data || {}); }),
    update: wrap((pin, id, data) => { requireProf(pin); return updateFigure(id, data || {}); }),
    remove: wrap((pin, id) => { requireProf(pin); return deleteFigure(id); }),
    // Gera o conteúdo do atlas.json para publicar no GitHub
    exportJson: () => JSON.stringify(figures, null, 2),
    hasLocalChanges: () => JSON.stringify(figures) !== JSON.stringify(ATLAS),
    restore: wrap(() => { safeStorage.del(ATLAS_KEY); figures = clone(ATLAS); return null; }),
  },
};
