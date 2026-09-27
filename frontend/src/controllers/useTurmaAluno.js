import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

// `aluno` vem de fora (contexto do Outlet, ver AlunoLayout.jsx) — esse hook
// busca só o que é específico desta tela: os detalhes desta turma.
export function useTurmaAluno() {
  const { id } = useParams();
  const [turma, setTurma] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    apiRequest(`/aluno/minhas/turmas/${id}`, { signal: controller.signal })
      .then((dados) => {
        if (!cancelado) setTurma(dados);
      })
      .catch((err) => {
        if (!cancelado && err.name !== "AbortError") {
          setErro(err.message || "Não consegui abrir essa turma.");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [id]);

  return { turma, erro, carregando };
}
