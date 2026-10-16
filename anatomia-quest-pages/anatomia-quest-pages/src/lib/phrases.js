export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const PHRASES = {
  greet: (n) => [
    `Oi, ${n}! Eu sou o Doutor Ossinho 🦴 Bora estudar?`,
    `E aí, ${n}! Hoje a gente disseca esse conteúdo juntos!`,
    `Bem-vindo(a) de volta, ${n}! Meus ossos estavam com saudade 💀💚`,
  ],
  think: ['Hmm… pensa com calma 🤔', 'Lembra da aula? Você sabe essa!', 'Confio em você! 💪', 'Respira fundo… (pelos dois pulmões 🫁)'],
  atlasThink: ['A professora está apontando… o que é isso? 👉', 'Olha bem a posição e os vizinhos!', 'Direita do paciente = sua esquerda, hein! 😉'],
  correct: ['Isso aí! Anatomia na veia! 💉', 'Acertou em cheio! 🎯', 'Que orgulho, futuro(a) doutor(a)! 🩺', 'Mandou bem! Sinapse total ⚡'],
  combo: (c) => [`Combo x${c}! Você está pegando fogo! 🔥`, `${c} seguidas! Ninguém te segura! 🚀`],
  wrong: ['Ops! Até os ossos tremem às vezes 😅', 'Quase! Lê a explicação que eu te espero.', 'Errar faz parte. Bora pra próxima! 💪'],
  timeout: ['O tempo voou! ⏰ Na próxima você pega.'],
  win: ['Que show! Você está craque! 🏆', 'Arrasou! Tô até tremendo os ossos de alegria! 🎉'],
  ok: ['Bom trabalho! Mais um pouco e chega nas 3 estrelas ⭐', 'Mandou bem! Revisa os erros e volta mais forte.'],
  low: ['Calma, todo anatomista começou assim. Bora revisar? 📚', 'Não desanima! Use o modo Revisar erros que eu te ajudo.'],
};
