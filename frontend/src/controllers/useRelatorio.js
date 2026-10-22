import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { mensagemErroCarregamento } from "../utils/erroCarregamento";

// Busca um relatório do professor — da atividade (GET /atividade/{id}/relatorio)
// ou do aluno (GET /aluno/{id}/relatorio).
export function useRelatorio(endpoint) {
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest(endpoint, { signal: controller.signal })
      .then((dados) => {
        if (!cancelado) setRelatorio(dados);
      })
      .catch((err) => {
        if (!cancelado && err.name !== "AbortError") {
          setErro(mensagemErroCarregamento(err, err.message || "Não foi possível carregar o relatório."));
        }
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [endpoint]);

  return { relatorio, erro, carregando: !relatorio && !erro };
}
