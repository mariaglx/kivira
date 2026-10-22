// Textos da tela de Auditoria: o que cada ação do log significa em português,
// em que categoria ela entra e de que aparelho veio.

export const CATEGORIAS = [
  { chave: "", rotulo: "Tudo", acoes: [] },
  { chave: "acessos", rotulo: "Acessos", acoes: ["LOGIN", "LOGIN_FALHOU", "LOGOUT", "PRIMEIRO_ACESSO_ALUNO", "VER_COMO_ALUNO"] },
  { chave: "falhas", rotulo: "Tentativas falhas", acoes: ["LOGIN_FALHOU"] },
  {
    chave: "turmas",
    rotulo: "Turmas e alunos",
    acoes: [
      "CRIAR_TURMA", "ATUALIZAR_TURMA", "EXCLUIR_TURMA", "CRIAR_MATRICULA", "ATUALIZAR_MATRICULA",
      "EXCLUIR_MATRICULA", "CADASTRAR_ALUNO", "CADASTRAR_ALUNOS_LOTE", "CRIAR_ALUNO", "ATUALIZAR_ALUNO",
      "EXCLUIR_ALUNO", "RESETAR_SENHA_ALUNO",
    ],
  },
  {
    chave: "atividades",
    rotulo: "Atividades",
    acoes: [
      "CRIAR_ATIVIDADE", "ATUALIZAR_ATIVIDADE", "EXCLUIR_ATIVIDADE", "SALVAR_QUESTOES_ATIVIDADE",
      "CRIAR_QUESTAO", "ATUALIZAR_QUESTAO", "EXCLUIR_QUESTAO",
      "CRIAR_OPCAO_QUESTAO", "ATUALIZAR_OPCAO_QUESTAO", "EXCLUIR_OPCAO_QUESTAO",
    ],
  },
  { chave: "jogo", rotulo: "Partidas", acoes: ["CONCLUIR_SESSAO_JOGO", "ENCERRAR_SESSAO_POR_TEMPO"] },
  {
    chave: "contas",
    rotulo: "Contas",
    acoes: ["CRIAR_PROFESSOR", "ATUALIZAR_PROFESSOR", "EXCLUIR_PROFESSOR", "ALTERAR_SENHA_PROFESSOR", "PROMOVER_ADMIN"],
  },
];

const CATEGORIA_DA_ACAO = Object.fromEntries(
  CATEGORIAS.filter((c) => c.chave && c.chave !== "falhas").flatMap((c) => c.acoes.map((a) => [a, c.chave])),
);
export const categoriaDaAcao = (acao) => (acao === "LOGIN_FALHOU" ? "falhas" : CATEGORIA_DA_ACAO[acao] ?? "outros");

const VERBOS = {
  LOGIN: "entrou no sistema",
  LOGOUT: "saiu do sistema",
  PRIMEIRO_ACESSO_ALUNO: "fez o primeiro acesso e criou a senha",
  VER_COMO_ALUNO: "abriu o app como o aluno",
  CRIAR_TURMA: "criou a turma",
  ATUALIZAR_TURMA: "editou a turma",
  EXCLUIR_TURMA: "excluiu a turma",
  CRIAR_MATRICULA: "matriculou um aluno",
  ATUALIZAR_MATRICULA: "alterou uma matrícula",
  EXCLUIR_MATRICULA: "tirou um aluno da turma",
  CADASTRAR_ALUNO: "cadastrou um aluno",
  CADASTRAR_ALUNOS_LOTE: "cadastrou alunos",
  CRIAR_ALUNO: "criou a conta de aluno",
  ATUALIZAR_ALUNO: "editou um aluno",
  EXCLUIR_ALUNO: "excluiu o aluno",
  RESETAR_SENHA_ALUNO: "gerou senha nova para um aluno",
  CRIAR_ATIVIDADE: "criou a atividade",
  ATUALIZAR_ATIVIDADE: "editou a atividade",
  EXCLUIR_ATIVIDADE: "excluiu a atividade",
  SALVAR_QUESTOES_ATIVIDADE: "salvou as questões de uma atividade",
  CRIAR_QUESTAO: "criou uma questão",
  ATUALIZAR_QUESTAO: "editou uma questão",
  EXCLUIR_QUESTAO: "excluiu uma questão",
  CRIAR_OPCAO_QUESTAO: "criou uma resposta",
  ATUALIZAR_OPCAO_QUESTAO: "editou uma resposta",
  EXCLUIR_OPCAO_QUESTAO: "excluiu uma resposta",
  CONCLUIR_SESSAO_JOGO: "terminou uma partida",
  ENCERRAR_SESSAO_POR_TEMPO: "teve uma partida encerrada pelo tempo",
  CRIAR_PROFESSOR: "criou a conta de professor",
  ATUALIZAR_PROFESSOR: "editou um perfil de professor",
  EXCLUIR_PROFESSOR: "excluiu o professor",
  ALTERAR_SENHA_PROFESSOR: "trocou a própria senha",
  PROMOVER_ADMIN: "deu acesso de admin para",
};

// O que aparece depois do verbo: o nome/título que o log guardou, quando tem.
function complemento(log) {
  const d = log.detalhes ?? {};
  const alvo = d.titulo ?? d.nome ?? d.nome_completo ?? d.email;
  if (alvo) return ` "${alvo}"`;
  if (log.acao === "CADASTRAR_ALUNOS_LOTE" && d.quantidade) return ` (${d.quantidade})`;
  if (log.acao === "CONCLUIR_SESSAO_JOGO" && d.xp_ganho != null) return ` (+${d.xp_ganho} XP)`;
  return "";
}

// "Ana Souza entrou no sistema" — quem fez + o que fez.
export function descreverLog(log) {
  const d = log.detalhes ?? {};
  const quem = log.usuario?.nome || log.usuario?.identificador || d.identificador || "Conta excluída";
  if (log.acao === "LOGIN_FALHOU") {
    return d.motivo === "usuario_inexistente"
      ? { quem: d.identificador ?? "?", oque: "tentou entrar, mas esse login não existe" }
      : { quem, oque: "errou a senha ao tentar entrar" };
  }
  const verbo = VERBOS[log.acao] ?? `${log.acao.toLowerCase().replaceAll("_", " ")}`;
  return { quem, oque: `${verbo}${complemento(log)}` };
}

export const TELA_DE_LOGIN = { login: "tela do professor", login_aluno: "tela do aluno", login_form: "API (Swagger)" };

// "iPhone · Safari", "Windows · Chrome" — o suficiente pra reconhecer o aparelho.
export function descreverAparelho(navegador) {
  if (!navegador) return null;
  const sistema =
    [["iPhone", "iPhone"], ["iPad", "iPad"], ["Android", "Android"], ["Windows", "Windows"],
      ["Mac OS", "Mac"], ["CrOS", "Chromebook"], ["Linux", "Linux"]].find(([marca]) => navegador.includes(marca))?.[1];
  const app =
    [["Edg/", "Edge"], ["OPR/", "Opera"], ["SamsungBrowser", "Samsung Internet"], ["Firefox/", "Firefox"],
      ["Chrome/", "Chrome"], ["Safari/", "Safari"]].find(([marca]) => navegador.includes(marca))?.[1];
  return [sistema, app].filter(Boolean).join(" · ") || "Outro aparelho";
}

// Campos que já aparecem na linha principal não se repetem nos detalhes
const JA_MOSTRADOS = new Set(["ip", "navegador", "identificador", "via", "motivo"]);
export const detalhesExtras = (detalhes = {}) => Object.entries(detalhes).filter(([chave]) => !JA_MOSTRADOS.has(chave));
