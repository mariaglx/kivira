// Único lugar que mexe nos dados de sessão guardados no localStorage.
// Recebe os campos já em camelCase (quem chama mapeia a resposta da API); as
// chaves do localStorage continuam as mesmas pra não deslogar quem já está logado.
export function salvarSessao({ accessToken, tipo }) {
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (tipo) localStorage.setItem("user_type", tipo);
}

export function limparSessao() {
  ["access_token", "refresh_token", "user_type", ...CHAVES_VISUALIZACAO].forEach((k) => localStorage.removeItem(k));
}

// "Ver como aluno" do admin: guarda o token do admin de lado, entra com o token
// (só leitura) da criança e, ao voltar, restaura o admin onde ele estava.
const CHAVES_VISUALIZACAO = ["admin_token", "visualizando_aluno", "admin_voltar_para"];

export function entrarComoAluno({ accessToken, nome, voltarPara }) {
  localStorage.setItem("admin_token", localStorage.getItem("access_token"));
  localStorage.setItem("visualizando_aluno", nome);
  localStorage.setItem("admin_voltar_para", voltarPara);
  salvarSessao({ accessToken, tipo: "estudante" });
}

export function voltarParaAdmin() {
  const voltarPara = localStorage.getItem("admin_voltar_para") || "/professor";
  salvarSessao({ accessToken: localStorage.getItem("admin_token"), tipo: "admin" });
  CHAVES_VISUALIZACAO.forEach((k) => localStorage.removeItem(k));
  return voltarPara;
}

export const alunoVisualizado = () => localStorage.getItem("visualizando_aluno");

export const ehAdmin = () => localStorage.getItem("user_type") === "admin";

// Página inicial de quem está logado (o logo das telas leva pra cá); sem sessão, a landing.
export function paginaInicial() {
  if (!localStorage.getItem("access_token")) return "/";
  const tipo = localStorage.getItem("user_type");
  if (tipo === "admin") return "/professor";
  if (tipo === "professor") return "/professor";
  if (tipo === "estudante") return "/aluno/home";
  return "/";
}
