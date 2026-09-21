import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

export function useTurmasAluno() {
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/aluno/me"), apiRequest("/aluno/minhas/turmas")])
      .then(([perfil, lista]) => {
        setAluno(perfil);
        setTurmas(lista);
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setCarregando(false));
  }, [navigate]);

  const sair = () => {
    limparSessao();
    navigate("/");
  };

  return { aluno, turmas, carregando, sair };
}
