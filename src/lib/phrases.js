export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const PHRASES = {
  greet: (n, subject) => [
    `Oi, ${n}! Eu sou o Doutor Ossinho 🦴 Bora estudar ${subject}?`,
    `E aí, ${n}! Hoje a gente destrincha ${subject} juntos!`,
    `Bem-vindo(a) de volta, ${n}! Meus ossos estavam com saudade 💀💚`,
  ],
  think: ['Hmm… pensa com calma 🤔', 'Lembra da aula? Você sabe essa!', 'Confio em você! 💪', 'Respira fundo… (pelos dois pulmões 🫁)'],
  write: ['Escreve com suas palavras, como se explicasse para um colega ✍️', 'Pense: estrutura, função e o que diferencia! 🧠', 'Não precisa ser perfeito, precisa ter os pontos-chave! 🔑'],
  review: ['Compare com o modelo e seja honesto(a) na autoavaliação 😉'],
  atlasThink: ['A professora está apontando… o que é isso? 👉', 'Olha bem a posição e os vizinhos!', 'Observe o epitélio e a parede! 🔎'],
  organ: ['Que lâmina é essa? Olha o epitélio primeiro! 🔬', 'Cartilagem? Músculo? Glândulas? Pistas, pistas… 🕵️'],
  correct: ['Isso aí! Na veia! 💉', 'Acertou em cheio! 🎯', 'Que orgulho, futuro(a) enfermeiro(a)! 🩺', 'Mandou bem! Sinapse total ⚡'],
  partial: ['Quase lá! Faltou pouquinho 🤏', 'Meio caminho andado! Revisa os pontos que faltaram.'],
  combo: (c) => [`Combo x${c}! Você está pegando fogo! 🔥`, `${c} seguidas! Ninguém te segura! 🚀`],
  wrong: ['Ops! Até os ossos tremem às vezes 😅', 'Quase! Lê a explicação que eu te espero.', 'Errar faz parte. Bora pra próxima! 💪'],
  timeout: ['O tempo voou! ⏰ Na próxima você pega.'],
  win: ['Que show! Você está craque! 🏆', 'Arrasou! Tô até tremendo os ossos de alegria! 🎉'],
  ok: ['Bom trabalho! Mais um pouco e chega nas 3 estrelas ⭐', 'Mandou bem! Revisa os erros e volta mais forte.'],
  low: ['Calma, todo mundo começou assim. Bora revisar? 📚', 'Não desanima! Use o modo Revisar erros que eu te ajudo.'],
};
