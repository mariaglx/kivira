import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest, limparCache } from "../services/api";
import { entrarComoAluno } from "../services/sessao";

// "Ver como aluno" do admin: pega um token só-leitura da criança e abre a Home
// dela. A faixa no topo (AvisoVisualizacao) traz o admin de volta pra cá.
export function useVerComoAluno() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [abrindo, setAbrindo] = useState(null);
  const [erro, setErro] = useState("");

  const verComoAluno = async (alunoId) => {
    setAbrindo(alunoId);
    setErro("");
    try {
      const { access_token: accessToken, nome } = await apiRequest(`/admin/alunos/${alunoId}/ver_como`, { method: "POST" });
      entrarComoAluno({ accessToken, nome, voltarPara: pathname });
      limparCache();
      navigate("/aluno/home");
    } catch (e) {
      setErro(e.message || "Não foi possível abrir a conta do aluno.");
      setAbrindo(null);
    }
  };

  return { verComoAluno, abrindo, erro };
}
