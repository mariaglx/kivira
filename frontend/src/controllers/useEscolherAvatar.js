import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { buscarAvatares } from "../services/avatarService";

export function useEscolherAvatar() {
  const navigate = useNavigate();
  const [avatares, setAvatares] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [selecionado, setSelecionado] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    buscarAvatares()
      .then((dados) => {
        if (!cancelado) setAvatares(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message || "Não foi possível carregar os avatares.");
      });

    apiRequest("/aluno/me", { signal: controller.signal })
      .then((aluno) => {
        if (!cancelado) setAlunoId(aluno.id);
      })
      .catch((e) => {
        if (!cancelado && e.name !== "AbortError") navigate("/login_aluno", { replace: true });
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
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
