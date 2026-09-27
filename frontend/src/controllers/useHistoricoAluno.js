import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// `aluno` vem de fora (contexto do Outlet, ver AlunoLayout.jsx) — esse hook
// busca só o que é específico desta tela: as partidas já jogadas.
export function useHistoricoAluno() {
  const [sessoes, setSessoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest("/aluno/minhas/sessoes", { signal: controller.signal })
      .then((lista) => {
        if (!cancelado) setSessoes(lista);
      })
      .catch((erro) => {
        if (!cancelado && erro.name !== "AbortError") {
          console.error("Erro ao carregar histórico:", erro.message);
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

  return { sessoes, carregando };
}
