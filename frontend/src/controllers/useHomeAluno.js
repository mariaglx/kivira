import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export function useHomeAluno() {
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/aluno/me"), apiRequest("/atividade/aluno/minhas")])
      .then(([perfil, lista]) => {
        setAluno(perfil);
        setAtividades(lista);
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

  return { aluno, atividades, carregando, sair };
}
