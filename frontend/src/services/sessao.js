// Único lugar que mexe nos dados de sessão guardados no localStorage.
// Recebe os campos já em camelCase (quem chama mapeia a resposta da API); as
// chaves do localStorage continuam as mesmas pra não deslogar quem já está logado.
export function salvarSessao({ accessToken, refreshToken, tipo }) {
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  if (tipo) localStorage.setItem("user_type", tipo);
}

export function limparSessao() {
  ["access_token", "refresh_token", "user_type"].forEach((k) => localStorage.removeItem(k));
}

// Página inicial de quem está logado (o logo das telas leva pra cá); sem sessão, a landing.
export function paginaInicial() {
  if (!localStorage.getItem("access_token")) return "/";
  const tipo = localStorage.getItem("user_type");
  if (tipo === "admin") return "/admin";
  if (tipo === "professor") return "/professor";
  if (tipo === "estudante") return "/aluno/home";
  return "/";
}
