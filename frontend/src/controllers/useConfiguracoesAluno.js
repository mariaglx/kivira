import { useState } from "react";
import { apiRequest } from "../services/api";

// `aluno`/`setAluno` vêm de fora (contexto do Outlet, ver AlunoLayout.jsx) —
// antes esse hook buscava /aluno/me por conta própria, duplicando a mesma
// busca que a Sidebar já faz, e editar o apelido aqui não atualizava a
// Sidebar porque cada uma tinha sua própria cópia dos dados.
export function useConfiguracoesAluno({ aluno, setAluno, carregandoAluno }) {
  // Inicializa já com o valor certo pro caso comum (o aluno chega nesta tela
  // vindo de outra, então `aluno` já está carregado no primeiro render) — só
  // a comparação abaixo cobre o caso raro de entrar direto nesta URL, quando
  // `aluno` ainda é null no primeiro render e chega depois.
  const [apelido, setApelido] = useState(aluno?.apelido || "");
  const [salvandoApelido, setSalvandoApelido] = useState(false);
  const [avisoApelido, setAvisoApelido] = useState(null);

  // Troca de senha em 2 etapas (wizard): primeiro os 3 emojis de agora,
  // depois os 3 novos — avança sozinho quando cada etapa completa 3 emojis.
  const [etapaSenha, setEtapaSenha] = useState(1);
  const [senhaAtual, setSenhaAtual] = useState([]);
  const [senhaNova, setSenhaNova] = useState([]);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState(null);

  // Só preenche o campo quando o aluno chega (ou muda, ex: após salvar) — sem
  // useEffect (evita o "cascading render" que o eslint acusa), mesmo padrão
  // do useJogo pra resetar estado quando um parâmetro externo muda: ajusta
  // direto durante a renderização, comparando com a referência anterior.
  const [alunoAnterior, setAlunoAnterior] = useState(aluno);
  if (aluno !== alunoAnterior) {
    setAlunoAnterior(aluno);
    if (aluno) setApelido(aluno.apelido || "");
  }

  const alternarSenhaAtual = (emoji) => {
    setAvisoSenha(null);
    setSenhaAtual((atual) => {
      if (atual.includes(emoji)) return atual.filter((e) => e !== emoji);
      if (atual.length >= 3) return atual;
      const nova = [...atual, emoji];
      if (nova.length === 3) setEtapaSenha(2);
      return nova;
    });
  };

  const alternarSenhaNova = (emoji) => {
    setAvisoSenha(null);
    setSenhaNova((atual) => {
      if (atual.includes(emoji)) return atual.filter((e) => e !== emoji);
      if (atual.length >= 3) return atual;
      return [...atual, emoji];
    });
  };

  const apagarUltimoDaEtapaAtual = () => {
    setAvisoSenha(null);
    if (etapaSenha === 1) {
      setSenhaAtual((atual) => atual.slice(0, -1));
    } else {
      setSenhaNova((atual) => atual.slice(0, -1));
    }
  };

  const voltarParaSenhaAtual = () => {
    setAvisoSenha(null);
    setSenhaNova([]);
    setEtapaSenha(1);
  };

  const reiniciarWizardSenha = () => {
    setEtapaSenha(1);
    setSenhaAtual([]);
    setSenhaNova([]);
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

  const salvarAvatar = async (arquivo) => {
    await apiRequest(`/aluno/${aluno.id}`, {
      method: "PATCH",
      data: { avatar_url: arquivo },
    });
    setAluno((atual) => ({ ...atual, avatar_url: arquivo }));
  };

  const salvarSenha = async () => {
    if (senhaAtual.length !== 3 || senhaNova.length !== 3) return;

    setAvisoSenha(null);
    setSalvandoSenha(true);
    try {
      await apiRequest("/aluno/trocar_senha", {
        method: "POST",
        data: { senha_atual: senhaAtual, emojis: senhaNova },
      });
      reiniciarWizardSenha();
      setAvisoSenha({ tipo: "ok", texto: "Senha trocada! Guarde bem os novos emojis." });
    } catch (err) {
      // Erro mais comum aqui é senha atual incorreta — volta pra etapa 1 pra
      // ela tentar de novo, em vez de deixar presa numa etapa 2 sem saída.
      setEtapaSenha(1);
      setSenhaAtual([]);
      setSenhaNova([]);
      setAvisoSenha({
        tipo: "erro",
        texto: err.message || "Não consegui trocar a senha agora.",
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  return {
    aluno,
    carregando: carregandoAluno,
    apelido,
    setApelido,
    salvarApelido,
    salvandoApelido,
    avisoApelido,
    salvarAvatar,
    etapaSenha,
    senhaAtual,
    senhaNova,
    alternarSenhaAtual,
    alternarSenhaNova,
    apagarUltimoDaEtapaAtual,
    voltarParaSenhaAtual,
    salvarSenha,
    salvandoSenha,
    avisoSenha,
  };
}
