import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { salvarSessao } from "../services/sessao";

export function useLoginEmoji(username) {
  const navigate = useNavigate();
  const [emojis, setEmojis] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const alternarEmoji = (emoji) => {
    setEmojis((atual) => {
      if (atual.includes(emoji)) return atual.filter((e) => e !== emoji);
      if (atual.length >= 3) return atual;
      return [...atual, emoji];
    });
  };

  const entrar = async (e) => {
    e.preventDefault();
    setErro("");

    if (emojis.length !== 3) {
      setErro("Escolha os 3 emojis da sua senha.");
      return;
    }

    setCarregando(true);
    try {
      const login = await apiRequest("/auth_kivira/login_aluno", {
        method: "POST",
        data: { username, senha: emojis.join("") },
      });

      salvarSessao({ accessToken: login?.access_token, refreshToken: login?.refresh_token, tipo: "estudante" });

      const perfil = await apiRequest("/aluno/me");
      navigate(perfil.avatar_url ? "/aluno/home" : "/aluno/escolher-avatar");
    } catch (err) {
      // O username já foi conferido no status-acesso da tela anterior, então
      // credencial recusada aqui só pode ser a senha. Qualquer outro código é
      // problema do sistema — não faz sentido culpar a criança por isso.
      setErro(
        err.status === 400 || err.status === 401
          ? "Senha incorreta. Tente de novo."
          : "Não consegui entrar agora. Tente daqui a pouco.",
      );
      setEmojis([]);
    } finally {
      setCarregando(false);
    }
  };

  return { emojis, alternarEmoji, erro, carregando, entrar };
}
