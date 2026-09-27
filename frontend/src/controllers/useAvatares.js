import { useEffect, useState } from "react";
import { buscarAvatares } from "../services/avatarService";

// Só a lista de avatares (categorias + filtro) — sem estado de seleção nem de
// confirmação, pra poder ser usado tanto na tela cheia de primeiro acesso
// (useEscolherAvatar) quanto no modal de troca de bichinho (Configurações).
export function useAvatares() {
  const [avatares, setAvatares] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    buscarAvatares()
      .then((dados) => {
        if (!cancelado) setAvatares(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message || "Não foi possível carregar os avatares.");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const categorias = ["todos", ...new Set(avatares.map((a) => a.categoria))];
  const avataresDaCategoria =
    categoriaAtiva === "todos"
      ? avatares
      : avatares.filter((a) => a.categoria === categoriaAtiva);

  return { categorias, categoriaAtiva, setCategoriaAtiva, avataresDaCategoria, erro };
}
