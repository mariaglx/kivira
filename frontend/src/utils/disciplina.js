// Emoji temático por disciplina — `disciplina` é texto livre digitado pelo
// professor ao criar a atividade (não é um enum no backend), então casamos
// por palavra-chave em vez de comparar valor exato.
const PALAVRA_CHAVE_EMOJI = [
  [/ci[eê]nc/i, "🌿"],
  [/matem[aá]t/i, "🔢"],
  [/portugu[eê]s|linguagem/i, "📚"],
  [/hist[oó]ria/i, "🏛️"],
  [/geograf/i, "🌎"],
  [/art/i, "🎨"],
  [/ingl[eê]s/i, "🔤"],
  [/educa[cç][aã]o f[ií]sica/i, "🤸"],
];

export function iconeDisciplina(disciplina) {
  const encontrada = PALAVRA_CHAVE_EMOJI.find(([regex]) => regex.test(disciplina || ""));
  return encontrada ? encontrada[1] : "📘";
}
