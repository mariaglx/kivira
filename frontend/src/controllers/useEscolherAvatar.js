import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAvatares } from "./useAvatares";
import { useAlunoAtual } from "./useAlunoAtual";

// Essa tela fica fora do AlunoLayout (é tela cheia, sem Header/Tabs — ver
// App.jsx), então busca o aluno por conta própria, mas reaproveita o mesmo
// hook que o layout usa (evita reimplementar o fetch/cancelamento aqui).
export function useEscolherAvatar() {
  const navigate = useNavigate();
  const { aluno } = useAlunoAtual();
  const { categorias, categoriaAtiva, setCategoriaAtiva, avataresDaCategoria, erro: erroAvatares } = useAvatares();
  const [selecionado, setSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const confirmar = async () => {
    if (!selecionado || !aluno) return;

    setErro("");
    setCarregando(true);
    try {
      await apiRequest(`/aluno/${aluno.id}`, {
        method: "PATCH",
        data: { avatar_url: selecionado },
      });
      navigate("/aluno/home");
    } catch (e) {
      setErro(e.message || "Não foi possível salvar seu avatar.");
    } finally {
      setCarregando(false);
    }
  };

  return {
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    avataresDaCategoria,
    selecionado,
    setSelecionado,
    confirmar,
    carregando,
    erro: erro || erroAvatares,
  };
}
