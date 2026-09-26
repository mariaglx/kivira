import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

export function useHomeAluno() {
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [atividades, setAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    Promise.all([
      apiRequest("/aluno/me", opcoesFetch),
      apiRequest("/atividade/aluno/minhas", opcoesFetch),
    ])
      .then(([perfil, lista]) => {
        if (cancelado) return;
        setAluno(perfil);
        setAtividades(lista);
      })
      .catch((erro) => {
        if (!cancelado && erro.name !== "AbortError") navigate("/login_aluno", { replace: true });
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [navigate]);

  const sair = async () => {
    try {
      await apiRequest("/auth_kivira/logout", { method: "POST" });
    } catch {
      // ignora: logout local não pode ficar travado por causa do log
    }
    limparSessao();
    navigate("/login_aluno");
  };

  return { aluno, atividades, carregando, sair };
}
