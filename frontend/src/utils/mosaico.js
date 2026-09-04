// Calcula a grade (colunas x linhas) usada para fatiar a imagem da atividade em mosaico.
// Os tamanhos "oficiais" do LUK (6, 9, 12, 24) têm proporções fixas; qualquer outra
// quantidade cai num fallback genérico (grade o mais quadrada possível).
const GRADES_CONHECIDAS = {
  6: { colunas: 3, linhas: 2 },
  9: { colunas: 3, linhas: 3 },
  12: { colunas: 4, linhas: 3 },
  24: { colunas: 6, linhas: 4 },
};

export function calcularGradeMosaico(quantidadeBlocos) {
  if (GRADES_CONHECIDAS[quantidadeBlocos]) {
    return GRADES_CONHECIDAS[quantidadeBlocos];
  }

  const colunas = Math.ceil(Math.sqrt(quantidadeBlocos));
  const linhas = Math.ceil(quantidadeBlocos / colunas);
  return { colunas, linhas };
}

// Dado o índice (1-based) do bloco e a grade, retorna o recorte de fundo (CSS background-*)
// que faz essa fatia da imagem aparecer alinhada no slot correspondente do tabuleiro.
export function calcularFatiaMosaico(indiceBloco, grade) {
  const { colunas, linhas } = grade;
  const coluna = (indiceBloco - 1) % colunas;
  const linha = Math.floor((indiceBloco - 1) / colunas);

  const bgX = colunas > 1 ? (coluna / (colunas - 1)) * 100 : 0;
  const bgY = linhas > 1 ? (linha / (linhas - 1)) * 100 : 0;

  return {
    backgroundPosition: `${bgX}% ${bgY}%`,
    backgroundSize: `${colunas * 100}% ${linhas * 100}%`,
  };
}
