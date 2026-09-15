import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

export function usePrimeiroAcesso(username) {
  const navigate = useNavigate();
  const [senhaTemporaria, setSenhaTemporaria] = useState("");
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

  const confirmar = async (e) => {
    e.preventDefault();
    setErro("");

    if (!senhaTemporaria.trim()) {
      setErro("Informe a senha temporária fornecida pelo professor.");
      return;
    }
    if (emojis.length !== 3) {
      setErro("Escolha exatamente 3 emojis para sua nova senha.");
      return;
    }

    setCarregando(true);
    try {
      await apiRequest("/aluno/primeiro_acesso", {
        method: "POST",
        data: { username, senha_temporaria: senhaTemporaria, emojis },
      });

      // "/primeiro_acesso" só troca a senha, não devolve token — loga em
      // seguida já com a senha-emoji nova pra seguir direto pro avatar
      const login = await apiRequest("/auth_kivira/login_aluno", {
        method: "POST",
        data: { username, senha: emojis.join("") },
      });

      localStorage.setItem("access_token", login.access_token);
      localStorage.setItem("refresh_token", login.refresh_token);
      localStorage.setItem("user_type", "estudante");

      navigate("/aluno/escolher-avatar");
    } catch (err) {
      setErro(err.message || "Não foi possível concluir o primeiro acesso.");
    } finally {
      setCarregando(false);
    }
  };

  return {
    senhaTemporaria,
    setSenhaTemporaria,
    emojis,
    alternarEmoji,
    erro,
    carregando,
    confirmar,
  };
}
