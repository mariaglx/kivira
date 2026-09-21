import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export function useHistoricoAluno() {
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null); // null = "todas"
  const [expandidas, setExpandidas] = useState(() => new Set());

  useEffect(() => {
    Promise.all([apiRequest("/aluno/me"), apiRequest("/sessao_jogo/minhas")])
      .then(([perfil, historico]) => {
        setAluno(perfil);
        setAtividades(historico);
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setCarregando(false));
  }, [navigate]);

  const sair = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_type");
    navigate("/");
  };

  const alternarExpandida = (atividadeId) => {
    setExpandidas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(atividadeId)) {
        proximo.delete(atividadeId);
      } else {
        proximo.add(atividadeId);
      }
      return proximo;
    });
  };

  // Turmas presentes no histórico, na ordem em que apareceram — vira as
  // pílulas de filtro. Sem Set de objetos (não dá pra comparar por valor),
  // então filtra por turma_id já visto.
  const turmasDisponiveis = [];
  const idsVistos = new Set();
  for (const atividade of atividades) {
    if (atividade.turma_id && !idsVistos.has(atividade.turma_id)) {
      idsVistos.add(atividade.turma_id);
      turmasDisponiveis.push({ id: atividade.turma_id, nome: atividade.turma_nome });
    }
  }

  const atividadesFiltradas = turmaSelecionada
    ? atividades.filter((a) => a.turma_id === turmaSelecionada)
    : atividades;

  return {
    aluno,
    atividades: atividadesFiltradas,
    turmasDisponiveis,
    turmaSelecionada,
    setTurmaSelecionada,
    expandidas,
    alternarExpandida,
    carregando,
    sair,
  };
}
