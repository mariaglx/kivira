import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_type");
    navigate("/");
  };

  return { aluno, turmas, carregando, sair };
}
