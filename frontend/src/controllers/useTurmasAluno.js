import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// `aluno` vem de fora (contexto do Outlet, ver AlunoLayout.jsx) — esse hook
// busca só o que é específico desta tela: a lista de turmas do aluno.
export function useTurmasAluno() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest("/aluno/minhas/turmas", { signal: controller.signal })
      .then((lista) => {
        if (!cancelado) setTurmas(lista);
      })
      .catch((erro) => {
        if (!cancelado && erro.name !== "AbortError") {
          console.error("Erro ao carregar turmas:", erro.message);
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, []);

  return { turmas, carregando };
}
