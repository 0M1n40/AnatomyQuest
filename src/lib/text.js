// Normaliza texto para comparar respostas discursivas (sem acentos, minúsculo).
export const normalize = (s = '') =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+\- ]/g, ' ').replace(/\s+/g, ' ').trim();

// Marca quais pontos-chave aparecem na resposta do aluno.
export function checkKeyPoints(answer, keyPoints = []) {
  const text = ` ${normalize(answer)} `;
  return keyPoints.map((kp) => ({
    label: kp.label,
    found: kp.keywords.some((k) => {
      const n = normalize(k);
      return n.length <= 3 ? new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`).test(text) : text.includes(n);
    }),
  }));
}

export const suggestGrade = (found, total) =>
  found >= Math.ceil(total * 0.75) ? 'correct' : found >= Math.ceil(total * 0.4) ? 'partial' : 'wrong';
