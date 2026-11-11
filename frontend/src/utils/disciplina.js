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

// Cor e ícone por disciplina nas telas do professor (capa, quadrado da linha,
// chip). Mesmo casamento por palavra-chave; as classes ficam escritas inteiras
// pro Tailwind enxergar. `icone` é o nome de um ícone do lucide-react.
const MAT = { bg: "bg-mat-bg", fg: "text-mat-fg", chip: "bg-mat-bg text-mat-fg-escuro" };
const CIE = { bg: "bg-cie-bg", fg: "text-cie-fg", chip: "bg-cie-bg text-cie-fg-escuro" };
const POR = { bg: "bg-por-bg", fg: "text-por-fg-escuro", chip: "bg-por-bg text-coral-texto" };
const OURO = { bg: "bg-ouro-bg", fg: "text-ouro-fg", chip: "bg-ouro-bg text-ouro-fg-escuro" };

const PALAVRA_CHAVE_COR = [
  [/ci[eê]nc/i, { ...CIE, icone: "Leaf" }],
  [/matem[aá]t/i, { ...MAT, icone: "Shapes" }],
  [/portugu[eê]s|linguagem/i, { ...POR, icone: "BookOpen" }],
  [/ingl[eê]s/i, { ...POR, icone: "Languages" }],
  [/hist[oó]ria/i, { ...OURO, icone: "Landmark" }],
  [/geograf/i, { ...MAT, icone: "Globe" }],
  [/art/i, { ...POR, icone: "Palette" }],
  [/educa[cç][aã]o f[ií]sica/i, { ...CIE, icone: "Bike" }],
];

export function corDisciplina(disciplina) {
  const encontrada = PALAVRA_CHAVE_COR.find(([regex]) => regex.test(disciplina || ""));
  return encontrada ? encontrada[1] : { ...OURO, icone: "BookMarked" };
}

// Nome com acento pra exibir ("Matematica" digitado sem acento vira "Matemática").
const NOMES = [
  [/^matematica$/i, "Matemática"],
  [/^ciencias?$/i, "Ciências"],
  [/^portugues$/i, "Português"],
  [/^historia$/i, "História"],
  [/^geografia$/i, "Geografia"],
  [/^ingles$/i, "Inglês"],
  [/^artes?$/i, "Artes"],
];

export function nomeDisciplina(disciplina) {
  const texto = (disciplina || "").trim();
  const encontrado = NOMES.find(([regex]) => regex.test(texto));
  return encontrado ? encontrado[1] : texto;
}
