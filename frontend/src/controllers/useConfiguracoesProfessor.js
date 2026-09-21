import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

// `professor`/`setProfessor` vêm de fora (contexto do Outlet, ver ProfessorLayout.jsx)
// — antes esse hook buscava /professor/me por conta própria, duplicando a mesma
// busca que a Sidebar já faz, e editar o perfil aqui não atualizava a Sidebar
// porque cada uma tinha sua própria cópia dos dados.
export function useConfiguracoesProfessor({ professor, setProfessor, carregandoProfessor }) {
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    total_turmas: 0,
    total_atividades: 0,
    total_alunos: 0,
  });
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    // incluir_turmas_recentes=false: essa tela só usa os 3 totais, não a lista
    // de turmas recentes — pedir isso ao backend evita ele montar essa lista à toa
    apiRequest("/professor/dashboard/resumo?incluir_turmas_recentes=false", {
      signal: controller.signal,
    })
      .then((resumo) => {
        if (!cancelado) setMetricas(resumo.metricas);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar configurações:", err.message);
      })
      .finally(() => {
        if (!cancelado) setCarregandoMetricas(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
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
      limparSessao();
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
    carregando: carregandoProfessor || carregandoMetricas,
    erro,
    setErro,
    salvando,
    salvarPerfil,
    salvarAvatar,
    alterarSenha,
    excluirConta,
  };
}
