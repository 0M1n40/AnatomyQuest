export const TITLES = ['Calouro', 'Monitor', 'Residente', 'Especialista', 'Mestre', 'Lenda do Laboratório'];
export const XP_PER_LEVEL = 500;
export const level = (xp = 0) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const title = (xp = 0) => TITLES[Math.min(level(xp) - 1, TITLES.length - 1)];
export const levelProgress = (xp = 0) => ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

export const safeStorage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignora */ } },
};

export const SYSTEM_LABEL = {
  resp: 'Respiratório', dig: 'Digestório', uri: 'Urinário', masc: 'Genital masculino', fem: 'Genital feminino', endo: 'Endócrino', outros: 'Outros',
};

export const SOURCE_LABEL = { prova: '📄 Caiu na prova', quiz: '🧪 Quiz da professora', 'prova+quiz': '📄 Prova + 🧪 Quiz' };
export const LETTERS = 'ABCDEFG';
