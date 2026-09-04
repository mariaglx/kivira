import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export function useConfiguracoesProfessor() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [metricas, setMetricas] = useState({
    total_turmas: 0,
    total_atividades: 0,
    total_alunos: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const [perfil, resumo] = await Promise.all([
          apiRequest("/professor/me"),
          apiRequest("/professor/dashboard/resumo"),
        ]);
        setProfessor(perfil);
        setMetricas(resumo.metricas);
      } catch (err) {
        console.error("Erro ao carregar configurações:", err.message);
        if (
          err.message?.includes("Token") ||
          err.message?.includes("401") ||
          err.message?.includes("autorização")
        ) {
          localStorage.removeItem("access_token");
          navigate("/login");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [navigate]);

  const salvarPerfil = async (dados) => {
    setSalvando(true);
    setErro("");
    try {
      await apiRequest(`/professor/${professor.id}`, {
        method: "PATCH",
        data: dados,
      });
      setProfessor((atual) => ({ ...atual, ...dados }));
      return true;
    } catch (err) {
      setErro(err.message || "Não foi possível salvar suas informações.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const salvarAvatar = (avatarUrl) => salvarPerfil({ avatar_url: avatarUrl });

  const alterarSenha = async ({ senhaAtual, senhaNova }) => {
    setErro("");
    try {
      await apiRequest("/professor/me/senha", {
        method: "PATCH",
        data: { senha_atual: senhaAtual, senha_nova: senhaNova },
      });
      return true;
    } catch (err) {
      setErro(err.message || "Não foi possível alterar sua senha.");
      return false;
    }
  };

  const excluirConta = async () => {
    setErro("");
    try {
      await apiRequest(`/professor/${professor.id}`, { method: "DELETE" });
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_type");
      navigate("/");
      return true;
    } catch (err) {
      setErro(err.message || "Não foi possível excluir sua conta.");
      return false;
    }
  };

  return {
    professor,
    metricas,
    carregando,
    erro,
    setErro,
    salvando,
    salvarPerfil,
    salvarAvatar,
    alterarSenha,
    excluirConta,
  };
}
