import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../services/api";

export function useTurmaDetalhe() {
  const { id } = useParams();
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiRequest(`/turma/${id}`),
      apiRequest(`/aluno_turma/turma/${id}`),
      apiRequest("/atividade/professor/minhas"),
    ])
      .then(([dadosTurma, dadosAlunos, dadosAtividades]) => {
        if (cancelado) return;
        setTurma(dadosTurma);
        setAlunos(dadosAlunos);
        setAtividades(
          dadosAtividades.filter((a) => a.turma_id === Number(id)),
        );
      })
      .catch((err) => setErro(err.message || "Não foi possível carregar a turma"))
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  return { id, turma, alunos, atividades, carregando, erro };
}
