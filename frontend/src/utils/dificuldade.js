// Rótulo lúdico dos 3 níveis de dificuldade (o enum do backend continua
// "facil" | "medio" | "dificil" — isso aqui é só a "casca" pro aluno).
export const DIFICULDADE_LABEL = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Máximo",
};

export const DIFICULDADE_EMOJI = {
  facil: "🌱",
  medio: "🔥",
  dificil: "💎",
};

// Quantas estrelas (1 a 3) representam cada dificuldade nos cards de atividade
export const DIFICULDADE_ESTRELAS = {
  facil: 1,
  medio: 2,
  dificil: 3,
};

// Rótulo e cor da dificuldade nas telas do professor (lá é "Difícil", não o
// "Máximo" lúdico do aluno).
export const DIFICULDADE_PROFESSOR = {
  facil: { rotulo: "Fácil", estilo: "bg-cie-bg text-cie-fg-escuro" },
  medio: { rotulo: "Médio", estilo: "bg-ouro-bg text-ouro-fg-escuro" },
  dificil: { rotulo: "Difícil", estilo: "bg-por-bg text-coral-texto" },
};
