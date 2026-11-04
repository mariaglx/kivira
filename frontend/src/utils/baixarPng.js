// Exporta um gráfico do Recharts como PNG (pros gráficos irem pro artigo).
// O Recharts desenha em <svg>, mas a legenda dele é HTML e não sairia na
// imagem — por isso a legenda é desenhada aqui no canvas, junto do título.

const ESCALA = 2; // 2x: nítido impresso no artigo
const MARGEM = 24;
const ALTURA_TITULO = 32;
const ALTURA_LINHA_LEGENDA = 22;
const QUADRADO = 12;
const ESPACO_ITEM = 20;

// "Distribuição das respostas" → "distribuicao-das-respostas"
export function nomeArquivo(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Quebra os itens da legenda em linhas que caibam em `largura`.
// `medir(texto)` devolve a largura do texto em px.
export function linhasDaLegenda(itens, largura, medir) {
  const linhas = [];
  let linha = [];
  let x = 0;
  for (const item of itens) {
    const tamanho = QUADRADO + 6 + medir(item.rotulo);
    if (linha.length && x + tamanho > largura) {
      linhas.push(linha);
      linha = [];
      x = 0;
    }
    linha.push({ ...item, x });
    x += tamanho + ESPACO_ITEM;
  }
  if (linha.length) linhas.push(linha);
  return linhas;
}

function carregarImagem(url) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = reject;
    imagem.src = url;
  });
}

export async function baixarPng(svg, { titulo, legenda = [], arquivo }) {
  const { width, height } = svg.getBoundingClientRect();
  const copia = svg.cloneNode(true);
  copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copia.setAttribute("width", width);
  copia.setAttribute("height", height);
  // Fonte da página não carrega dentro de uma imagem; cai numa parecida
  copia.setAttribute("font-family", "Inter, Arial, sans-serif");
  const grafico = await carregarImagem(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copia))}`
  );

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fonteLegenda = "600 13px Inter, Arial, sans-serif";
  ctx.font = fonteLegenda;
  const linhas = linhasDaLegenda(legenda, width, (texto) => ctx.measureText(texto).width);

  const larguraTotal = width + 2 * MARGEM;
  const alturaTotal = MARGEM + ALTURA_TITULO + height + linhas.length * ALTURA_LINHA_LEGENDA + MARGEM;
  canvas.width = larguraTotal * ESCALA;
  canvas.height = alturaTotal * ESCALA;
  ctx.scale(ESCALA, ESCALA);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, larguraTotal, alturaTotal);

  ctx.fillStyle = "#214a5a";
  ctx.textBaseline = "top";
  ctx.font = "800 18px Nunito, Arial, sans-serif";
  ctx.fillText(titulo, MARGEM, MARGEM);

  ctx.drawImage(grafico, MARGEM, MARGEM + ALTURA_TITULO, width, height);

  ctx.font = fonteLegenda;
  ctx.textBaseline = "middle";
  linhas.forEach((linha, i) => {
    const y = MARGEM + ALTURA_TITULO + height + i * ALTURA_LINHA_LEGENDA + ALTURA_LINHA_LEGENDA / 2;
    for (const item of linha) {
      ctx.fillStyle = item.cor;
      ctx.fillRect(MARGEM + item.x, y - QUADRADO / 2, QUADRADO, QUADRADO);
      ctx.fillStyle = "#214a5a";
      ctx.fillText(item.rotulo, MARGEM + item.x + QUADRADO + 6, y);
    }
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${arquivo || nomeArquivo(titulo)}.png`;
  link.click();
  URL.revokeObjectURL(link.href);
}
