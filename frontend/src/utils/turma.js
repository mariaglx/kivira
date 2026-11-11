// Quebra uma lista de alunos (colada ou vinda de arquivo) em
// {nome, sobrenome, matricula}. As colunas viram as colunas da tabela da tela,
// nesta ordem: Nome | Sobrenome | Matrícula. Uma coluna só (o caso comum, a
// lista de nomes da chamada) é lida como nome completo e quebrada no primeiro
// espaço.
//
// O separador é decidido uma vez pro texto inteiro, não por linha: senão
// "Souza, Maria" numa lista de nomes soltos viraria duas colunas sozinha. A
// vírgula só entra na disputa pra arquivo .csv (`aceitarVirgula`), onde ela é
// separador por definição; numa cola de texto ela é quase sempre pontuação.
function separadorDe(texto, aceitarVirgula) {
  const candidatos = aceitarVirgula ? ["\t", ";", ","] : ["\t", ";"];
  return candidatos.find((candidato) => texto.includes(candidato)) ?? null;
}

// Planilha de secretaria quase sempre vem com uma linha de título em cima.
// Sem isso o professor cadastra um aluno chamado "Nome Completo".
// ponytail: lista fixa de títulos comuns, não detecção esperta — se aparecer
// um cabeçalho fora dela, o professor apaga a linha com o "×" e segue.
const CABECALHOS = new Set([
  "nome",
  "nomes",
  "aluno",
  "alunos",
  "estudante",
  "estudantes",
  "nome completo",
  "nome do aluno",
]);

const semAcento = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Ponto de encontro dos três formatos: texto colado, planilha e Word chegam
// todos aqui como linhas de colunas já em string, e daqui pra frente o
// tratamento é um só.
export function montarAlunos(linhasDeColunas) {
  const linhas = linhasDeColunas
    .map((colunas) => colunas.map((coluna) => String(coluna ?? "").trim()))
    .filter((colunas) => colunas.some(Boolean));

  // Só a primeira coluna decide: numa planilha o título dela é "Nome", e numa
  // lista de uma coluna só é a linha inteira ("NOME COMPLETO"). Olhar nome +
  // sobrenome juntos derrubaria um aluno de verdade chamado "Nome Sobrenome".
  if (linhas.length && CABECALHOS.has(semAcento(linhas[0][0]))) {
    linhas.shift();
  }

  return linhas.map((colunas) => {
    if (colunas.length === 1) {
      const [nome = "", ...resto] = colunas[0].split(/\s+/);
      return { nome, sobrenome: resto.join(" "), matricula: "" };
    }
    const [nome = "", sobrenome = "", matricula = ""] = colunas;
    return { nome, sobrenome, matricula };
  });
}

export function parseAlunosColados(texto, { aceitarVirgula = false } = {}) {
  const separador = separadorDe(texto, aceitarVirgula);
  return montarAlunos(
    texto
      .split(/\r?\n/)
      .filter((linha) => linha.trim())
      .map((linha) => (separador ? linha.split(separador) : [linha.trim()])),
  );
}

// Decodifica os bytes do arquivo. O Excel em português salva CSV em
// Windows-1252 por padrão, não em UTF-8 — ler tudo como UTF-8 transformaria
// "João" em lixo. UTF-8 no modo fatal joga erro em byte inválido, o que serve
// de teste: deu erro, é 1252. O BOM que o Excel às vezes põe na frente sai
// fora, senão ele gruda no primeiro nome.
function decodificar(bytes) {
  let texto;
  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes);
  }
  return texto.replace(/^\uFEFF/, "");
}

// Tira as tags do HTML que o mammoth gera e desfaz as poucas entidades que ele
// usa. Regex em HTML qualquer seria furada, mas a saída do mammoth é um
// subconjunto minúsculo e previsível (p, li, table/tr/td, strong, em).
const textoLimpo = (trecho) =>
  trecho
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, codigo) => String.fromCharCode(codigo))
    .replace(/&amp;/g, "&")
    .trim();

// A lista num .docx vem de dois jeitos: numa tabela (cada célula é uma coluna)
// ou como parágrafos soltos, um nome por linha. Tabela tem precedência porque
// quando ela existe é ela que tem os dados.
export function linhasDeHtmlDocx(html) {
  const deTabela = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((linha) =>
    [...linha[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((celula) =>
      textoLimpo(celula[1]),
    ),
  );
  if (deTabela.length) return deTabela;

  return [...html.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi)].map((bloco) => [
    textoLimpo(bloco[2]),
  ]);
}

const EXTENSOES_DE_TEXTO = /\.(csv|txt|tsv)$/i;

// As duas bibliotecas pesadas entram por import dinâmico: quem só cola a lista
// (o caminho comum) nunca baixa nenhuma das duas.
async function linhasDeXlsx(arquivo) {
  // "/browser": o pacote não tem entrada raiz, só uma por ambiente
  const { default: lerPlanilha } = await import("read-excel-file/browser");
  // Devolve uma entrada por aba ([{ sheet, data }]), não as linhas direto. A
  // lista da turma está na primeira aba; planilha com várias abas é problema
  // de quem montou, não vale adivinhar qual é a certa.
  const [primeiraAba] = await lerPlanilha(arquivo);
  return primeiraAba?.data ?? [];
}

async function linhasDeDocx(arquivo) {
  const mammoth = await import("mammoth/mammoth.browser");
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await arquivo.arrayBuffer() });
  return linhasDeHtmlDocx(html);
}

// Lê um arquivo de lista de alunos: .csv/.txt/.tsv, .xlsx ou .docx.
export async function lerArquivoDeAlunos(arquivo) {
  const nome = arquivo.name;
  let linhas;

  if (EXTENSOES_DE_TEXTO.test(nome)) {
    const texto = decodificar(await arquivo.arrayBuffer());
    const separador = separadorDe(texto, true);
    linhas = texto
      .split(/\r?\n/)
      .filter((linha) => linha.trim())
      .map((linha) => (separador ? linha.split(separador) : [linha.trim()]));
  } else if (/\.xlsx$/i.test(nome)) {
    linhas = await linhasDeXlsx(arquivo);
  } else if (/\.docx$/i.test(nome)) {
    linhas = await linhasDeDocx(arquivo);
  } else {
    throw new Error(
      `Não dá pra abrir "${nome}". Use .csv, .txt, .xlsx ou .docx, ou copie a lista e cole num campo.`,
    );
  }

  const alunos = montarAlunos(linhas);
  if (!alunos.length) {
    throw new Error(`"${nome}" está vazio.`);
  }
  return alunos;
}

// Subtítulo de uma turma: "3º ano · 2026". O ano escolar só entra se o nome já
// não disser ele (turma "3º ano A" do 3º ano viraria "3º ano A / 3º ano").
export function subtituloTurma({ nome = "", ano_escolar: anoEscolar, ano_letivo: anoLetivo }) {
  const repetido = anoEscolar && nome.toLowerCase().includes(anoEscolar.toLowerCase());
  return [repetido ? null : anoEscolar, anoLetivo].filter(Boolean).join(" · ");
}
