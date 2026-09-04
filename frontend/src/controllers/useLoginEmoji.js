import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

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

      localStorage.setItem("access_token", login.access_token);
      localStorage.setItem("refresh_token", login.refresh_token);
      localStorage.setItem("user_type", "estudante");

      const perfil = await apiRequest("/aluno/me");
      navigate(perfil.avatar_url ? "/aluno/home" : "/aluno/escolher-avatar");
    } catch (err) {
      setErro(err.message || "Senha incorreta. Tente novamente.");
      setEmojis([]);
    } finally {
      setCarregando(false);
    }
  };

  return { emojis, alternarEmoji, erro, carregando, entrar };
}
