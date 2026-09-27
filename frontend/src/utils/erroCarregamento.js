// Mensagem amigável pra erro de carregamento de uma lista — usa `err.status`
// (anexado pelo apiRequest, ver services/api.js) em vez de vasculhar o texto
// da mensagem, que muda de redação sem avisar quem depende dele.
export function mensagemErroCarregamento(err, mensagemPadrao) {
  if (err.status === 403) return "Você não tem permissão para acessar esta área.";
  return mensagemPadrao;
}
