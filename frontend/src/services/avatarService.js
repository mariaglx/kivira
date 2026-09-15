import { apiRequest } from "./api";

// A lista de avatares é dado de referência quase estático (raramente muda) —
// antes, toda tela que precisava dela (Configurações do professor, Escolher
// avatar do aluno) buscava /avatar/ do zero a cada montagem. Guardar a mesma
// Promise em memória faz com que a 2ª chamada (de outra tela, ou do próprio
// StrictMode remontando em dev) reaproveite o resultado em vez de bater no
// banco de novo. Dura só a sessão da aba — um F5 limpa o cache.
let avataresCache = null;

export function buscarAvatares() {
  if (!avataresCache) {
    avataresCache = apiRequest("/avatar/").catch((erro) => {
      avataresCache = null; // permite tentar de novo numa próxima chamada
      throw erro;
    });
  }
  return avataresCache;
}
