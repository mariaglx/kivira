import { CalculatorIcon } from "../components/icons/calculator";
import { AtomIcon } from "../components/icons/atom";
import { BookOpenIcon } from "../components/icons/book-open";
import { BlocksIcon } from "../components/icons/blocks";

// `atividade.disciplina` é texto livre no banco (o professor digita), então a
// cor/ícone do card vem de um reconhecimento por palavra-chave, não de um enum.
// Qualquer disciplina não reconhecida cai no bucket "geral" (ícone de blocos,
// remete ao próprio mosaico do jogo) em vez de quebrar ou ficar sem cor.
const BUCKETS = [
  { chave: "geral", termos: [], Icon: BlocksIcon, bg: "bg-laranja-claro/40", fg: "text-laranja" },
  { chave: "matematica", termos: ["matematic"], Icon: CalculatorIcon, bg: "bg-mat-bg", fg: "text-mat-fg" },
  { chave: "ciencias", termos: ["ciencia", "natureza", "biologia"], Icon: AtomIcon, bg: "bg-cie-bg", fg: "text-cie-fg" },
  { chave: "portugues", termos: ["portugu", "lingua", "alfabet", "leitura", "redacao"], Icon: BookOpenIcon, bg: "bg-por-bg", fg: "text-por-fg" },
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove acentos (NFD separa a letra do diacrítico)
}

export function identificarDisciplina(disciplina) {
  const texto = normalizar(disciplina || "");
  const encontrado = BUCKETS.find((bucket) => bucket.termos.some((termo) => texto.includes(termo)));
  return encontrado || BUCKETS[0];
}
