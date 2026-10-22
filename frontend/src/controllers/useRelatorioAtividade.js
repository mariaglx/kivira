import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { mensagemErroCarregamento } from "../utils/erroCarregamento";

// Busca o relatório de uma atividade (resumo, alunos e questões) — ver
// GET /atividade/{id}/relatorio no backend.
export function useRelatorioAtividade(id) {
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest(`/atividade/${id}/relatorio`, { signal: controller.signal })
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
  }, [id]);

  return { relatorio, erro, carregando: !relatorio && !erro };
}
