import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// Hook compartilhado pra "quem é o professor logado" — usado pela Sidebar (avatar/apelido)
// pra evitar que cada página busque por conta própria e esqueça de repassar os dados
// (era exatamente por isso que o avatar sumia em algumas telas)
// `ativo` falso (admin, que não tem cadastro de professor) não busca nada.
export function useProfessorAtual(ativo = true) {
  const [professor, setProfessor] = useState(null);
  const [carregando, setCarregando] = useState(ativo);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    const controller = new AbortController();

    apiRequest("/professor/me", { signal: controller.signal })
      .then((dados) => {
        if (!cancelado) setProfessor(dados);
      })
      .catch((erro) => {
        if (erro.name !== "AbortError") console.error("Erro ao buscar professor logado:", erro.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [ativo]);

  return { professor, setProfessor, carregando };
}
