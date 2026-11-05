import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest, limparCache } from "../services/api";
import { entrarComo } from "../services/sessao";

// "Ver como aluno/professor" do admin: pega um token só-leitura da conta e abre
// a tela inicial dela. A faixa no topo (AvisoVisualizacao) traz o admin de volta.
const PAPEIS = {
  aluno: { rota: "alunos", tipo: "estudante", inicio: "/aluno/home" },
  professor: { rota: "professores", tipo: "professor", inicio: "/professor" },
};

export function useVerComo() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // "aluno:3" / "professor:3" — aluno e professor podem ter o mesmo id
  const [abrindo, setAbrindo] = useState(null);
  const [erro, setErro] = useState("");

  const verComo = async (papel, id) => {
    const { rota, tipo, inicio } = PAPEIS[papel];
    setAbrindo(`${papel}:${id}`);
    setErro("");
    try {
      const { access_token: accessToken, nome } = await apiRequest(`/admin/${rota}/${id}/ver_como`, { method: "POST" });
      entrarComo({ accessToken, nome, tipo, voltarPara: pathname });
      limparCache();
      navigate(inicio);
    } catch (e) {
      setErro(e.message || "Não foi possível abrir essa conta.");
      setAbrindo(null);
    }
  };

  return { verComo, abrindo, erro };
}
