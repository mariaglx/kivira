import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

export function useTurmaAluno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [turma, setTurma] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/aluno/me"), apiRequest(`/aluno/minhas/turmas/${id}`)])
      .then(([perfil, dados]) => {
        setAluno(perfil);
        setTurma(dados);
      })
      .catch((err) => setErro(err.message || "Não consegui abrir essa turma."))
      .finally(() => setCarregando(false));
  }, [id]);

  const sair = () => {
    limparSessao();
    navigate("/");
  };

  return { aluno, turma, erro, carregando, sair };
}
