import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// Hook compartilhado pra "quem é o aluno logado" — mesma ideia do
// useProfessorAtual: usado pelo AlunoLayout pra buscar /aluno/me uma vez só
// (não a cada troca de tela) e repassar pra Sidebar e pras páginas via
// contexto do Outlet.
export function useAlunoAtual() {
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest("/aluno/me", { signal: controller.signal })
      .then((dados) => {
        if (!cancelado) setAluno(dados);
      })
      .catch((erro) => {
        if (erro.name !== "AbortError") console.error("Erro ao buscar aluno logado:", erro.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, []);

  return { aluno, setAluno, carregando };
}
