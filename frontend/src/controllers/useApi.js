import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { mensagemErroCarregamento } from "../utils/erroCarregamento";

// GET simples com estado de carregando/erro. `endpoint` null não busca nada.
// `atualizarCom` refaz a busca quando muda (o cache do apiRequest deixa isso
// de graça enquanto nada foi alterado). Guardamos de qual endpoint veio a
// resposta pra não mostrar a da turma anterior enquanto a nova carrega.
export function useApi(endpoint, atualizarCom = null) {
  const [resposta, setResposta] = useState({ endpoint: null, dados: null, erro: null });

  useEffect(() => {
    if (!endpoint) return;
    let cancelado = false;
    const controller = new AbortController();

    apiRequest(endpoint, { signal: controller.signal })
      .then((dados) => {
        if (!cancelado) setResposta({ endpoint, dados, erro: null });
      })
      .catch((err) => {
        if (!cancelado && err.name !== "AbortError") {
          setResposta({ endpoint, dados: null, erro: mensagemErroCarregamento(err, err.message || "Não foi possível carregar.") });
        }
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [endpoint, atualizarCom]);

  const atual = resposta.endpoint === endpoint;
  return {
    dados: atual ? resposta.dados : null,
    erro: atual ? resposta.erro : null,
    carregando: Boolean(endpoint) && !atual,
  };
}
