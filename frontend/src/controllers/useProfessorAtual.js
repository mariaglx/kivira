import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// Hook compartilhado pra "quem é o professor logado" — usado pela Sidebar (avatar/apelido)
// pra evitar que cada página busque por conta própria e esqueça de repassar os dados
// (era exatamente por isso que o avatar sumia em algumas telas)
export function useProfessorAtual() {
  const [professor, setProfessor] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
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
  }, []);

  return { professor, setProfessor, carregando };
}
