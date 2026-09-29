import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// `aluno` vem de fora (contexto do Outlet, ver AlunoLayout.jsx) — esse hook
// busca só o que é específico desta tela: as atividades disponíveis.
export function useHomeAluno() {
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest("/atividade/aluno/minhas", { signal: controller.signal })
      .then((lista) => {
        if (!cancelado) setAtividades(lista);
      })
      .catch((erro) => {
        if (!cancelado && erro.name !== "AbortError") {
          console.error("Erro ao carregar atividades:", erro.message);
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

  return { atividades, carregando };
}
