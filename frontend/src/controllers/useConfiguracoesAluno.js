import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

export function useConfiguracoesAluno() {
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [apelido, setApelido] = useState("");
  const [salvandoApelido, setSalvandoApelido] = useState(false);
  const [avisoApelido, setAvisoApelido] = useState(null);

  // Troca de senha: os 3 emojis atuais e os 3 novos, escolhidos no mesmo
  // SeletorEmoji que o login usa
  const [senhaAtual, setSenhaAtual] = useState([]);
  const [senhaNova, setSenhaNova] = useState([]);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState(null);

  useEffect(() => {
    apiRequest("/aluno/me")
      .then((perfil) => {
        setAluno(perfil);
        setApelido(perfil.apelido || "");
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setCarregando(false));
  }, [navigate]);

  const alternar = (lista, setLista) => (emoji) => {
    setAvisoSenha(null);
    setLista((atual) => {
      if (atual.includes(emoji)) return atual.filter((e) => e !== emoji);
      if (atual.length >= 3) return atual;
      return [...atual, emoji];
    });
  };

  const salvarApelido = async (e) => {
    e.preventDefault();
    const novo = apelido.trim();
    if (!novo) {
      setAvisoApelido({ tipo: "erro", texto: "Escreva como quer ser chamado." });
      return;
    }

    setAvisoApelido(null);
    setSalvandoApelido(true);
    try {
      await apiRequest(`/aluno/${aluno.id}`, {
        method: "PATCH",
        data: { apelido: novo },
      });
      setAluno((atual) => ({ ...atual, apelido: novo }));
      setAvisoApelido({ tipo: "ok", texto: "Pronto, nome trocado!" });
    } catch (err) {
      setAvisoApelido({
        tipo: "erro",
        texto: err.message || "Não consegui salvar agora.",
      });
    } finally {
      setSalvandoApelido(false);
    }
  };

  const salvarSenha = async (e) => {
    e.preventDefault();

    if (senhaAtual.length !== 3 || senhaNova.length !== 3) {
      setAvisoSenha({
        tipo: "erro",
        texto: "Escolha 3 emojis na senha de agora e 3 na senha nova.",
      });
      return;
    }

    setAvisoSenha(null);
    setSalvandoSenha(true);
    try {
      await apiRequest("/aluno/trocar_senha", {
        method: "POST",
        data: { senha_atual: senhaAtual, emojis: senhaNova },
      });
      setSenhaAtual([]);
      setSenhaNova([]);
      setAvisoSenha({ tipo: "ok", texto: "Senha trocada! Guarde bem os novos emojis." });
    } catch (err) {
      setAvisoSenha({
        tipo: "erro",
        texto: err.message || "Não consegui trocar a senha agora.",
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const sair = () => {
    limparSessao();
    navigate("/");
  };

  return {
    aluno,
    carregando,
    apelido,
    setApelido,
    salvarApelido,
    salvandoApelido,
    avisoApelido,
    senhaAtual,
    senhaNova,
    alternarSenhaAtual: alternar(senhaAtual, setSenhaAtual),
    alternarSenhaNova: alternar(senhaNova, setSenhaNova),
    salvarSenha,
    salvandoSenha,
    avisoSenha,
    sair,
  };
}
