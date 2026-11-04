// Perguntas dos questionários de feedback (professor e aluno), usadas pelos
// formulários e pelo dashboard do admin. `curto` é o rótulo no gráfico.

export const PERGUNTAS_PROFESSOR = [
  {
    campo: "facilidade_uso",
    curto: "Facilidade de uso",
    titulo: "Foi fácil entender como utilizar o Kivira?",
    opcoes: ["Muito difícil", "Difícil", "Neutro", "Fácil", "Muito fácil"],
  },
  {
    campo: "autonomia_aluno",
    curto: "Autonomia do aluno",
    titulo: "Você acha que o aluno consegue jogar no Kivira sozinho, sem precisar de ajuda?",
    opcoes: [
      "Não consegue",
      "Consegue com dificuldade",
      "Neutro",
      "Consegue",
      "Consegue tranquilamente",
    ],
  },
  {
    campo: "alinhamento_conteudo",
    curto: "Conteúdo atende",
    titulo: "Os conteúdos que você consegue montar no Kivira atendem o que você precisa ensinar?",
    opcoes: ["Não atendem", "Atendem pouco", "Neutro", "Atendem", "Atendem totalmente"],
  },
  {
    campo: "usaria_nas_aulas",
    curto: "Usaria nas aulas",
    titulo: "Você usaria o Kivira nas suas aulas?",
    opcoes: [
      "Com certeza não",
      "Provavelmente não",
      "Talvez",
      "Provavelmente sim",
      "Com certeza sim",
    ],
  },
];

// A 5ª do professor, de texto livre
export const PERGUNTA_ABERTA_PROFESSOR =
  "Deixe abaixo sugestões, críticas ou comentários que possam contribuir para a melhoria do Kivira.";

export const PERGUNTAS_ALUNO = [
  {
    campo: "diversao",
    curto: "Achou do Kivira",
    titulo: "O que você achou do Kivira?",
    opcoes: [
      { valor: 1, rosto: "😖", rotulo: "Ruim" },
      { valor: 2, rosto: "🙁", rotulo: "Meio ruim" },
      { valor: 3, rosto: "😐", rotulo: "Normal" },
      { valor: 4, rosto: "🙂", rotulo: "Bom" },
      { valor: 5, rosto: "😍", rotulo: "Muito bom" },
    ],
  },
  {
    campo: "autonomia",
    curto: "Jogou sozinho",
    titulo: "Você conseguiu jogar sozinho?",
    opcoes: [
      { valor: 1, rosto: "👎", rotulo: "Não" },
      { valor: 2, rosto: "🤔", rotulo: "Mais ou menos" },
      { valor: 3, rosto: "👍", rotulo: "Sim" },
    ],
  },
  {
    campo: "jogar_de_novo",
    curto: "Quer jogar de novo",
    titulo: "Você quer jogar de novo?",
    opcoes: [
      { valor: 1, rosto: "👎", rotulo: "Não" },
      { valor: 2, rosto: "🤔", rotulo: "Talvez" },
      { valor: 3, rosto: "👍", rotulo: "Sim" },
    ],
  },
];

// Cores em hex (e não var(--color-*)): o PNG exportado é o SVG fora da
// página, onde as variáveis do index.css não existem.
export const COR = {
  azul: "#214a5a",
  coral: "#eb7561",
  coralClaro: "#f5bab0", // coral 50% sobre branco
  neutro: "#d3dbde", // azul 20% sobre branco
  verdeClaro: "#9fd7bd", // verde 50% sobre branco
  verde: "#3fae7a",
};

// Do negativo pro positivo, pelo tamanho da escala
export const CORES_ESCALA = {
  2: [COR.coral, COR.verde],
  3: [COR.coral, COR.neutro, COR.verde],
  5: [COR.coral, COR.coralClaro, COR.neutro, COR.verdeClaro, COR.verde],
};
