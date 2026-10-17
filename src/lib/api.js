// "Backend" local do NurseHub: toda a lógica roda no navegador (GitHub Pages).
// Funções retornam Promise para manter a mesma interface de uma API real.
import { SUBJECTS, getSubject } from '../data/subjects.js';
import { safeStorage } from './progress.js';
import { checkKeyPoints, suggestGrade } from './text.js';

const DB_KEY = 'nursehub:db';
const ATLAS_KEY = (s) => `nursehub:atlas:${s}`;
const PROF_PIN = import.meta.env.VITE_PROF_PIN || 'anatomia';

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const wrap = (fn) => (...args) => {
  try { return Promise.resolve(clone(fn(...args))); } catch (e) { return Promise.reject(e); }
};

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============ Matéria atual ============
let subjectId = SUBJECTS[0].id;
const subject = () => getSubject(subjectId);

const INDEX = Object.fromEntries(SUBJECTS.map((s) => {
  const all = s.questions.flatMap((sys) => sys.questions.map((q) => ({ type: 'mcq', ...q, system: sys.id })));
  return [s.id, { all, byId: new Map(all.map((q) => [q.id, q])), systems: new Map(s.questions.map((x) => [x.id, x])) }];
}));
const idx = () => INDEX[subjectId];

function findQuestion(id) {
  const q = idx().byId.get(id);
  if (!q) throw new Error('Questão não encontrada.');
  return q;
}

function toPublic(q) {
  const s = idx().systems.get(q.system);
  const base = { id: q.id, type: q.type, source: q.source, system: { id: s.id, name: s.name, icon: s.icon }, text: q.text };
  if (q.type === 'open') return { ...base, keyCount: q.keyPoints.length };
  return { ...base, options: shuffle(q.options.map((text, i) => ({ id: i, text }))) };
}

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hintFor(q) {
  if (q.type === 'open') return `Sua resposta deve falar de: ${q.keyPoints.map((k) => k.label.split(/[:(]/)[0].trim()).join(' · ')}.`;
  const first = q.explanation.replace(/^⚠️[^.]*\.\s*/, '').split(/[.;:]/)[0];
  return first.replace(new RegExp(escapeRegex(q.options[q.answer]), 'gi'), '_____') + '…';
}

// ============ Jogadores (salvos neste navegador) ============
function loadDb() {
  try { return { players: {}, sessions: [], ...JSON.parse(safeStorage.get(DB_KEY) || '{}') }; } catch { return { players: {}, sessions: [] }; }
}
let db = loadDb();
const saveDb = () => safeStorage.set(DB_KEY, JSON.stringify(db));

const normalizeName = (name = '') => String(name).trim().replace(/\s+/g, ' ').slice(0, 30);
const key = (name) => normalizeName(name).toLowerCase();

function rawPlayer(name) {
  const k = key(name);
  if (!k) throw new Error('Informe o nome do jogador.');
  if (!db.players[k]) {
    db.players[k] = { name: normalizeName(name), xp: 0, games: 0, progress: {}, createdAt: new Date().toISOString() };
    saveDb();
  }
  const p = db.players[k];
  p.progress[subjectId] ||= { best: {}, stars: {}, wrong: [] };
  return p;
}
function playerView(name) {
  const p = rawPlayer(name);
  return { name: p.name, xp: p.xp, games: p.games, subject: subjectId, ...p.progress[subjectId] };
}

function markAnswer(name, qid, correct) {
  const prog = rawPlayer(name).progress[subjectId];
  const has = prog.wrong.includes(qid);
  if (correct && has) prog.wrong = prog.wrong.filter((id) => id !== qid);
  if (!correct && !has) prog.wrong.push(qid);
  saveDb();
}

const NO_RECORD = ['all', 'review', 'open', 'past'];

function saveSession(name, { mode, points = 0, hits = 0, total = 0, maxCombo = 0, grade }) {
  const p = rawPlayer(name);
  const prog = p.progress[subjectId];
  points = Math.max(0, Number(points) || 0);
  const pct = total ? Math.round((hits / total) * 100) : 0;
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
  const xp = Math.round(points / 10);
  p.xp += xp;
  p.games += 1;
  if (!NO_RECORD.includes(mode)) {
    prog.best[mode] = Math.max(prog.best[mode] || 0, points);
    prog.stars[mode] = Math.max(prog.stars[mode] || 0, stars);
  }
  const session = { player: p.name, subject: subjectId, mode, points, hits, total, pct, stars, xp, maxCombo, grade, at: new Date().toISOString() };
  db.sessions.push(session);
  if (db.sessions.length > 1500) db.sessions = db.sessions.slice(-1500);
  saveDb();
  return { session, player: playerView(name) };
}

function ranking(mode = 'xp', limit = 10) {
  if (mode === 'xp') {
    return Object.values(db.players).sort((a, b) => b.xp - a.xp).slice(0, limit).map((p) => ({ name: p.name, value: p.xp, games: p.games }));
  }
  const best = {};
  for (const s of db.sessions.filter((s) => (s.subject || 'anatomia') === subjectId && s.mode === mode)) {
    const value = mode === 'exam' ? s.grade ?? s.points / 100 : s.points;
    if (!best[s.player] || value > best[s.player].value) best[s.player] = { name: s.player, value, pct: s.pct };
  }
  return Object.values(best).sort((a, b) => b.value - a.value).slice(0, limit);
}

// ============ Atlas / Laminário (por matéria) ============
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const figCache = {};

function figuresOf(sid = subjectId) {
  if (figCache[sid]) return figCache[sid];
  const base = getSubject(sid).atlas;
  const version = hash(JSON.stringify(base));
  let figs = clone(base);
  try {
    const saved = JSON.parse(safeStorage.get(ATLAS_KEY(sid)));
    if (saved?.base === version && Array.isArray(saved.figures)) figs = saved.figures;
  } catch { /* ignora */ }
  figCache[sid] = figs;
  return figs;
}
function commitFigures(next) {
  const version = hash(JSON.stringify(subject().atlas));
  if (!safeStorage.set(ATLAS_KEY(subjectId), JSON.stringify({ base: version, figures: next }))) {
    throw new Error('Não foi possível salvar no navegador (espaço cheio ou bloqueado). Exporte o atlas.json e remova fotos grandes.');
  }
  figCache[subjectId] = next;
}
const figures = () => figuresOf();
const getFigure = (id) => {
  const f = figures().find((x) => x.id === id);
  if (!f) throw new Error('Figura não encontrada.');
  return f;
};

const pending = new Map();
function remember(entry) {
  if (pending.size > 3000) pending.clear();
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  pending.set(token, entry);
  return token;
}

function distractors(fig, target, n = 3) {
  const same = shuffle(fig.pins.filter((p) => p.id !== target.id));
  const others = shuffle(figures().filter((f) => f.id !== fig.id).flatMap((f) => f.pins));
  const out = [];
  for (const p of [...same, ...others]) {
    if (out.length >= n) break;
    if (p.label !== target.label && !out.some((o) => o.label === p.label)) out.push(p);
  }
  return out;
}
const pickOthers = (list, correct, n = 3) => shuffle([...new Set(list)].filter((x) => x !== correct)).slice(0, n);
const publicFigure = (f) => ({ id: f.id, title: f.title, image: f.image, source: f.source });
const hasOrgans = () => figures().filter((f) => f.organ).length >= 2;

function organQuestion(f) {
  const all = figures().filter((x) => x.organ);
  const token = remember({ figureId: f.id, organ: true });
  return {
    token,
    type: 'organ',
    figure: { id: f.id, title: 'Lâmina misteriosa', image: f.image, source: f.source },
    organOptions: shuffle([f.organ, ...pickOthers(all.map((x) => x.organ), f.organ)]),
    justOptions: shuffle([f.justification, ...pickOthers(all.filter((x) => x.organ !== f.organ).map((x) => x.justification), f.justification)]),
  };
}
function pinQuestion(f, p, kind) {
  const token = remember({ figureId: f.id, pinId: p.id });
  if (kind === 'locate' && f.pins.length >= 3) {
    return { token, type: 'locate', figure: publicFigure(f), prompt: p.label, pins: shuffle(f.pins).map((x) => ({ id: x.id, x: x.x, y: x.y })) };
  }
  const options = shuffle([p, ...distractors(f, p)]).map((x) => ({ id: x.id, label: x.label }));
  return { token, type: 'name', figure: publicFigure(f), target: { x: p.x, y: p.y }, options };
}

function buildQuiz(figure = 'all', type = 'mix', limit = 15) {
  const source = figure === 'all' ? figures() : [getFigure(figure)];
  if (type === 'organ') {
    const list = shuffle(source.filter((f) => f.organ)).slice(0, limit);
    if (!list.length) throw new Error('Esta matéria ainda não tem lâminas com órgão cadastrado.');
    return list.map(organQuestion);
  }
  const items = shuffle(source.flatMap((f) => f.pins.map((p) => ({ f, p })))).slice(0, limit);
  if (!items.length) throw new Error('Esta figura ainda não tem pontos marcados.');
  const organChance = type === 'mix' && hasOrgans() ? 0.3 : 0;
  const usedOrgan = new Set();
  return items.map(({ f, p }) => {
    if (organChance && f.organ && !usedOrgan.has(f.id) && Math.random() < organChance) {
      usedOrgan.add(f.id);
      return organQuestion(f);
    }
    return pinQuestion(f, p, type === 'mix' ? (Math.random() < 0.6 ? 'name' : 'locate') : type);
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
function checkOrgan(token, organ, justification) {
  const q = pending.get(token);
  if (!q) throw new Error('Questão expirada. Inicie uma nova partida.');
  const f = getFigure(q.figureId);
  return { organOk: organ === f.organ, justOk: justification === f.justification, organ: f.organ, justification: f.justification, title: f.title, pins: f.pins };
}

// ============ Simulado de prova ============
function buildExam({ mcq = 10, open = 4, image = 4 } = {}) {
  const all = idx().all;
  const objs = shuffle(all.filter((q) => q.type === 'mcq')).slice(0, mcq).map((q) => ({ kind: 'mcq', ...toPublic(q) }));
  const opens = shuffle(all.filter((q) => q.type === 'open')).slice(0, open).map((q) => ({ kind: 'open', ...toPublic(q) }));
  let imgs = [];
  if (image > 0) {
    if (hasOrgans()) {
      imgs = shuffle(figures().filter((f) => f.organ)).slice(0, image).map(organQuestion);
    } else {
      const pins = shuffle(figures().flatMap((f) => f.pins.map((p) => ({ f, p }))));
      const used = new Set();
      for (const { f, p } of pins) {
        if (imgs.length >= image) break;
        if (used.has(f.id) && used.size < figures().length) continue;
        used.add(f.id);
        imgs.push(pinQuestion(f, p, 'name'));
      }
    }
    imgs = imgs.map((q) => ({ kind: 'image', id: q.token, ...q }));
  }
  return [...objs, ...imgs, ...opens];
}
function examAvailability() {
  const all = idx().all;
  const imageCount = hasOrgans() ? figures().filter((f) => f.organ).length : figures().reduce((s, f) => s + f.pins.length, 0);
  return { mcq: all.filter((q) => q.type === 'mcq').length, open: all.filter((q) => q.type === 'open').length, image: imageCount, organ: hasOrgans() };
}

// ============ Mapa mental ============
function autoMindmap() {
  const s = subject();
  return {
    label: s.name,
    children: [
      ...s.questions.map((sys) => ({
        label: sys.name, system: sys.id,
        children: figures().filter((f) => f.system === sys.id).map((f) => ({ label: f.title, children: f.pins.map((p) => ({ label: p.label, note: p.explanation })) })),
      })),
    ],
  };
}

// ---- Editor ----
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const clamp = (n) => Math.max(0, Math.min(100, Math.round((Number(n) || 0) * 100) / 100));
const requireProf = (pin) => { if (pin !== PROF_PIN) throw new Error('Senha da professora incorreta.'); };
const checkImage = (d) => {
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(d || '')) throw new Error('Imagem inválida. Use PNG, JPG, WEBP ou GIF.');
  return d;
};
const cleanText = (v, max) => String(v || '').trim().slice(0, max);
const cleanPins = (pins = []) => pins
  .filter((p) => p && String(p.label || '').trim())
  .map((p) => ({
    id: p.id && !String(p.id).startsWith('new') ? String(p.id) : uid('pin'),
    label: cleanText(p.label, 80), x: clamp(p.x), y: clamp(p.y), explanation: cleanText(p.explanation, 400),
  }));

function createFigure({ title, system = 'outros', imageData, pins, organ, justification }) {
  if (!cleanText(title, 100)) throw new Error('Informe um título.');
  const fig = {
    id: uid('fig'), title: cleanText(title, 100), system, image: checkImage(imageData), builtin: false,
    organ: cleanText(organ, 80) || undefined, justification: cleanText(justification, 400) || undefined, pins: cleanPins(pins),
  };
  commitFigures([...figures(), fig]);
  return fig;
}
function updateFigure(id, { title, system, pins, imageData, organ, justification }) {
  const old = getFigure(id);
  if (imageData && old.builtin) throw new Error('A imagem de uma figura padrão não pode ser trocada. Crie uma nova figura.');
  const fig = { ...old };
  if (title !== undefined) fig.title = cleanText(title, 100) || old.title;
  if (system !== undefined) fig.system = system;
  if (pins !== undefined) fig.pins = cleanPins(pins);
  if (organ !== undefined) fig.organ = cleanText(organ, 80) || undefined;
  if (justification !== undefined) fig.justification = cleanText(justification, 400) || undefined;
  if (imageData) fig.image = checkImage(imageData);
  commitFigures(figures().map((f) => (f.id === id ? fig : f)));
  return fig;
}
function deleteFigure(id) {
  if (getFigure(id).builtin) throw new Error('Figuras padrão não podem ser excluídas (mas podem ser editadas).');
  commitFigures(figures().filter((f) => f.id !== id));
  return null;
}

// ============ Interface usada pelos componentes ============
export const api = {
  setSubject(id) { if (getSubject(id)) subjectId = id; return subjectId; },
  subject: () => subject(),
  subjects: () => SUBJECTS.map((s) => {
    const qs = s.questions.flatMap((x) => x.questions);
    return {
      id: s.id, name: s.name, icon: s.icon, tagline: s.tagline,
      total: qs.length, open: qs.filter((q) => q.type === 'open').length, past: qs.filter((q) => q.source).length, figures: s.atlas.length,
    };
  }),

  systems: wrap(() => subject().questions.map((s) => ({ id: s.id, name: s.name, icon: s.icon, total: s.questions.length, open: s.questions.filter((q) => q.type === 'open').length }))),
  counts: () => {
    const all = idx().all;
    return { open: all.filter((q) => q.type === 'open').length, past: all.filter((q) => q.source).length, prova: all.filter((q) => q.source?.includes('prova')).length, quiz: all.filter((q) => q.source?.includes('quiz')).length };
  },
  player: wrap((name) => playerView(name)),
  resetPlayer: wrap((name) => { rawPlayer(name).progress[subjectId] = { best: {}, stars: {}, wrong: [] }; saveDb(); return null; }),
  quiz: wrap((player, mode = 'all', limit = 40) => {
    const all = idx().all;
    let pool;
    if (mode === 'all') pool = shuffle(all.filter((q) => q.type === 'mcq')).slice(0, limit);
    else if (mode === 'open') pool = shuffle(all.filter((q) => q.type === 'open'));
    else if (mode === 'past') pool = shuffle(all.filter((q) => q.source));
    else if (mode === 'review') pool = shuffle(rawPlayer(player).progress[subjectId].wrong.map((id) => idx().byId.get(id)).filter(Boolean));
    else {
      if (!idx().systems.has(mode)) throw new Error('Sistema não encontrado.');
      pool = shuffle(all.filter((q) => q.system === mode));
    }
    return { mode, questions: pool.map(toPublic) };
  }),
  answer: wrap((player, questionId, optionId) => {
    const q = findQuestion(questionId);
    const correct = Number.isInteger(optionId) && optionId === q.answer;
    markAnswer(player, q.id, correct);
    return { correct, answerId: q.answer, answerText: q.options[q.answer], explanation: q.explanation };
  }),
  answerOpen: wrap((questionId, text) => {
    const q = findQuestion(questionId);
    const keyPoints = checkKeyPoints(text, q.keyPoints);
    const found = keyPoints.filter((k) => k.found).length;
    return { model: q.model, keyPoints, found, total: keyPoints.length, suggested: suggestGrade(found, keyPoints.length) };
  }),
  gradeOpen: wrap((player, questionId, result) => { markAnswer(player, findQuestion(questionId).id, result === 'correct'); return null; }),
  fifty: wrap((id) => {
    const q = findQuestion(id);
    return { remove: shuffle(q.options.map((_, i) => i).filter((i) => i !== q.answer)).slice(0, q.options.length > 4 ? 3 : 2) };
  }),
  hint: wrap((id) => ({ hint: hintFor(findQuestion(id)) })),
  flashcards: wrap((system) => {
    const list = system ? idx().all.filter((q) => q.system === system) : idx().all;
    return shuffle(list).map((q) => {
      const s = idx().systems.get(q.system);
      return q.type === 'open'
        ? { id: q.id, type: 'open', source: q.source, system: s.name, icon: s.icon, front: q.text, back: 'Resposta modelo', explanation: q.model }
        : { id: q.id, type: 'mcq', source: q.source, system: s.name, icon: s.icon, front: q.text, back: q.options[q.answer], explanation: q.explanation };
    });
  }),
  finish: wrap((player, payload) => saveSession(player, payload)),
  ranking: wrap((mode = 'xp') => ranking(mode)),
  mindmap: () => subject().mindmap || autoMindmap(),

  exam: {
    availability: () => examAvailability(),
    build: wrap((cfg) => buildExam(cfg)),
  },

  atlas: {
    figures: wrap(() => figures().map(({ id, title, system, image, builtin, pins, organ, source }) => ({ id, title, system, image, source, builtin: !!builtin, pinCount: pins.length, hasOrgan: !!organ }))),
    figure: wrap((id) => getFigure(id)),
    hasOrgans: () => hasOrgans(),
    quiz: wrap((figure, type, limit) => ({ questions: buildQuiz(figure, type, Math.min(Number(limit) || 15, 100)) })),
    answer: wrap((token, pinId) => checkAnswer(token, pinId)),
    answerOrgan: wrap((token, organ, justification) => checkOrgan(token, organ, justification)),
    auth: wrap((pin) => { requireProf(pin); return { ok: true }; }),
    create: wrap((pin, data) => { requireProf(pin); return createFigure(data || {}); }),
    update: wrap((pin, id, data) => { requireProf(pin); return updateFigure(id, data || {}); }),
    remove: wrap((pin, id) => { requireProf(pin); return deleteFigure(id); }),
    exportJson: () => JSON.stringify(figures(), null, 2),
    hasLocalChanges: () => JSON.stringify(figures()) !== JSON.stringify(subject().atlas),
    restore: wrap(() => { safeStorage.del(ATLAS_KEY(subjectId)); delete figCache[subjectId]; return null; }),
  },
};
