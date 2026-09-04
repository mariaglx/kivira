import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export function useEscolherAvatar() {
  const navigate = useNavigate();
  const [avatares, setAvatares] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [selecionado, setSelecionado] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    apiRequest("/avatar/")
      .then(setAvatares)
      .catch((e) => setErro(e.message || "Não foi possível carregar os avatares."));

    apiRequest("/aluno/me")
      .then((aluno) => setAlunoId(aluno.id))
      .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

  const categorias = ["todos", ...new Set(avatares.map((a) => a.categoria))];
  const avataresDaCategoria =
    categoriaAtiva === "todos"
      ? avatares
      : avatares.filter((a) => a.categoria === categoriaAtiva);

  const confirmar = async () => {
    if (!selecionado || !alunoId) return;

    setErro("");
    setCarregando(true);
    try {
      await apiRequest(`/aluno/${alunoId}`, {
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
    erro,
  };
}
