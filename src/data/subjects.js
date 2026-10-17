// Matérias do NurseHub. Para incluir uma nova matéria:
// 1) crie src/data/NOVA/questions.json, atlas.json (pode ser []) e mindmap.json (opcional)
// 2) importe aqui e adicione um item em SUBJECTS.
// Toda matéria ganha automaticamente: mapa mental, simulado de prova, flashcards, ranking etc.
import anatomiaQuestions from './anatomia/questions.json';
import anatomiaAtlas from './anatomia/atlas.json';
import anatomiaMindmap from './anatomia/mindmap.json';
import histologiaQuestions from './histologia/questions.json';
import histologiaAtlas from './histologia/atlas.json';
import histologiaMindmap from './histologia/mindmap.json';
import imunologiaQuestions from './imunologia/questions.json';
import imunologiaAtlas from './imunologia/atlas.json';
import imunologiaMindmap from './imunologia/mindmap.json';

export const SUBJECTS = [
  {
    id: 'anatomia',
    name: 'Anatomia',
    icon: '🦴',
    tagline: 'Órgãos, relações anatômicas e prova prática nas peças.',
    practice: {
      nav: 'Atlas', icon: '🖼️',
      title: 'Prova prática: identifique a estrutura',
      text: 'A professora aponta na peça e você responde. Treine com as figuras do Atlas.',
      mascot: 'Na prova prática a professora aponta e você identifica. Vamos treinar o olho! 👀',
    },
    questions: anatomiaQuestions, atlas: anatomiaAtlas, mindmap: anatomiaMindmap,
  },
  {
    id: 'histologia',
    name: 'Histologia',
    icon: '🔬',
    tagline: 'Tecidos, células e lâminas ao microscópio, com questões discursivas.',
    practice: {
      nav: 'Laminário', icon: '🔬',
      title: 'Prova prática: reconheça a lâmina',
      text: 'Diga qual é o órgão, justifique e identifique as estruturas apontadas nas lâminas.',
      mascot: 'Olho no microscópio! Primeiro o órgão, depois a justificativa. 🔬',
    },
    questions: histologiaQuestions, atlas: histologiaAtlas, mindmap: histologiaMindmap,
  },
  {
    id: 'imunologia',
    name: 'Imunologia',
    icon: '🛡️',
    tagline: 'Imunidade inata e adaptativa, anticorpos, MHC, infecções, hipersensibilidade e vacinas.',
    practice: {
      nav: 'Esquemas', icon: '🧫',
      title: 'Identifique nos esquemas',
      text: 'Anticorpo, MHC, complemento, fagocitose, hipersensibilidade… Aponte e nomeie cada parte.',
      mascot: 'Imunologia é visual! Reconheça cada peça dos esquemas que a prova adora. 🛡️',
    },
    questions: imunologiaQuestions, atlas: imunologiaAtlas, mindmap: imunologiaMindmap,
  },
];

export const getSubject = (id) => SUBJECTS.find((s) => s.id === id);
