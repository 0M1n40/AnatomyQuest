// Matérias do NurseHub. Para incluir uma nova matéria:
// 1) crie src/data/NOVA/questions.json e src/data/NOVA/atlas.json (pode ser [])
// 2) importe aqui e adicione um item em SUBJECTS.
import anatomiaQuestions from './anatomia/questions.json';
import anatomiaAtlas from './anatomia/atlas.json';
import histologiaQuestions from './histologia/questions.json';
import histologiaAtlas from './histologia/atlas.json';

export const SUBJECTS = [
  {
    id: 'anatomia',
    name: 'Anatomia',
    icon: '🦴',
    tagline: 'Órgãos, relações anatômicas e prova prática nas peças.',
    practice: {
      nav: 'Atlas',
      icon: '🖼️',
      title: 'Prova prática: identifique a estrutura',
      text: 'A professora aponta na peça e você responde. Treine com as figuras do Atlas.',
      mascot: 'Na prova prática a professora aponta e você identifica. Vamos treinar o olho! 👀',
    },
    questions: anatomiaQuestions,
    atlas: anatomiaAtlas,
  },
  {
    id: 'histologia',
    name: 'Histologia',
    icon: '🔬',
    tagline: 'Tecidos, células e lâminas ao microscópio, com questões discursivas.',
    practice: {
      nav: 'Laminário',
      icon: '🔬',
      title: 'Prova prática: reconheça a lâmina',
      text: 'Diga qual é o órgão, justifique e identifique as estruturas apontadas nas lâminas da aula.',
      mascot: 'Olho no microscópio! Primeiro o órgão, depois a justificativa. 🔬',
    },
    questions: histologiaQuestions,
    atlas: histologiaAtlas,
  },
];

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id);
