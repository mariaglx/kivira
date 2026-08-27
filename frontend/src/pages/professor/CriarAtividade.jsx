import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "animate.css";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { useCriarAtividade } from "../../controllers/useCriarAtividade";

const API_URL = "http://localhost:8000"; // Temporário, apenas para teste das atividades

const TOKEN_TEMPORARIO =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NCIsImV4cCI6MTc4ODEyNjQzNn0.rdtRcy1OTN768SmvMmihnYTOloU9buH7w-L9pmu9N1A"; // usuario_id=54, professor_id=32 — válido por 7 dias a partir de 23/08/2026

// TODO: Fazer puxar das turmas cadastradas posteriormente
const TURMAS_MOCK = [
  { id: 1, nome: "3º Ano A" },
  { id: 2, nome: "4º Ano B" },
  { id: 3, nome: "2º Ano A" },
];

export function CriarAtividade() {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    handleChange,
    questoes,
    setQuestoes,
    questoesParaRemover,
    setQuestoesParaRemover,
    handleChangeBloco,
    adicionarQuestao,
    removerQuestao,
    moverQuestao,
  } = useCriarAtividade();
  const [idAtividadeCriada, setIdAtividadeCriada] = useState(null);
  const [codigoAtividade, setCodigoAtividade] = useState(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [foiCriacao, setFoiCriacao] = useState(true);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [removendoId, setRemovendoId] = useState(null);
  const [entrandoId, setEntrandoId] = useState(null);
  const [arrastandoId, setArrastandoId] = useState(null);
  const [indiceAlvo, setIndiceAlvo] = useState(null);
  const [posicaoPointer, setPosicaoPointer] = useState({ x: 0, y: 0 });
  const [offsetPointer, setOffsetPointer] = useState({ x: 0, y: 0 });
  const [larguraCard, setLarguraCard] = useState(0);
  const [alturaCard, setAlturaCard] = useState(0);
  const [questoesInvalidas, setQuestoesInvalidas] = useState({});
  const [tentativaInvalida, setTentativaInvalida] = useState(0);
  const cardRefs = useRef({});
  const wrapperRefs = useRef({});
  const inputRefs = useRef({});
  const posicoesAntesRef = useRef(null);
  const indiceAlvoRef = useRef(null);

  // Embrulha o handleChangeBloco do hook: além de atualizar o dado, limpa o erro de validação do campo que acabou de ser corrigido
  const aoMudarBloco = (index, campo, valor) => {
    handleChangeBloco(index, campo, valor);

    const questao = questoes[index];
    if (!questao || !questoesInvalidas[questao.localId] || !valor.trim())
      return;

    const campoErro = campo === "texto_questao" ? "texto" : "resposta";
    setQuestoesInvalidas((atual) => {
      const erroAtual = atual[questao.localId];
      if (!erroAtual || !erroAtual[campoErro]) return atual;

      const novoErro = { ...erroAtual, [campoErro]: false };
      const copia = { ...atual };
      if (!novoErro.texto && !novoErro.resposta) {
        delete copia[questao.localId];
      } else {
        copia[questao.localId] = novoErro;
      }
      return copia;
    });
  };

  // Embrulha o adicionarQuestao do hook com a animação de entrada
  const aoClicarAdicionar = () => {
    const novaQuestao = adicionarQuestao();
    setEntrandoId(novaQuestao.localId);
    setTimeout(() => setEntrandoId(null), 20);
  };

  // Embrulha o removerQuestao do hook com a animação de saída
  const aoRemoverQuestao = (index) => {
    if (questoes.length <= 1) return;
    const questaoRemovida = questoes[index];
    setRemovendoId(questaoRemovida.localId);
    setTimeout(() => {
      removerQuestao(index);
      setRemovendoId(null);
    }, 300);
  };

  // Guarda a posição atual de cada card antes do "buraco" mudar de lugar, pra poder animar o deslize (técnica FLIP)
  const capturarPosicoesAntes = () => {
    const posicoes = {};
    Object.entries(wrapperRefs.current).forEach(([id, el]) => {
      if (el) posicoes[id] = el.getBoundingClientRect().top;
    });
    posicoesAntesRef.current = posicoes;
  };

  // Depois que o "buraco" muda de lugar e a lista já re-renderizou: cada card que mudou de posição
  // começa "teletransportado" de volta pro lugar antigo (sem transição) e desliza suavemente até o novo lugar
  useLayoutEffect(() => {
    const antes = posicoesAntesRef.current;
    if (!antes) return;
    posicoesAntesRef.current = null;

    Object.entries(wrapperRefs.current).forEach(([id, el]) => {
      if (!el || antes[id] === undefined) return;
      const depois = el.getBoundingClientRect().top;
      const delta = antes[id] - depois;
      if (Math.abs(delta) < 1) return;

      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;

      // Espera o navegador pintar o estado "deslocado" antes de animar de volta, senão não tem transição pra ver
      setTimeout(() => {
        el.style.transition = "transform 220ms ease-out";
        el.style.transform = "";
        setTimeout(() => {
          el.style.transition = "";
        }, 240);
      }, 20);
    });
  }, [indiceAlvo]);

  // Pega o card inteiro (com o conteúdo real) e o "descola" da lista, seguindo o mouse
  const iniciarArrasto = (e, questao) => {
    e.preventDefault();
    const cardOriginal = cardRefs.current[questao.localId];
    if (!cardOriginal) return;

    const rect = cardOriginal.getBoundingClientRect();
    const origemIndex = questoes.findIndex(
      (q) => q.localId === questao.localId,
    );

    setArrastandoId(questao.localId);
    indiceAlvoRef.current = origemIndex; // o "buraco" começa exatamente onde o card estava
    setIndiceAlvo(origemIndex);
    setLarguraCard(rect.width);
    setAlturaCard(rect.height);
    setOffsetPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setPosicaoPointer({ x: e.clientX, y: e.clientY });
  };

  // Enquanto arrasta: só atualiza o "buraco" (preview) — nada é decidido de verdade até soltar
  useEffect(() => {
    if (!arrastandoId) return;

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const aoMoverMouse = (e) => {
      setPosicaoPointer({ x: e.clientX, y: e.clientY });

      const elementoSobre = document.elementFromPoint(e.clientX, e.clientY);
      const cardSobre = elementoSobre?.closest("[data-questao-local-id]");
      const idSobre = cardSobre?.dataset.questaoLocalId;
      if (!idSobre || idSobre === arrastandoId) return;

      const semOrigem = questoes.filter((q) => q.localId !== arrastandoId);
      const alvoIndex = semOrigem.findIndex((q) => q.localId === idSobre);
      if (alvoIndex === -1) return;

      // Metade de cima do card alvo = buraco entra antes dele; metade de baixo = entra depois
      const rectAlvo = cardSobre.getBoundingClientRect();
      const entrarDepois = e.clientY > rectAlvo.top + rectAlvo.height / 2;

      const novoIndiceAlvo = entrarDepois ? alvoIndex + 1 : alvoIndex;
      if (novoIndiceAlvo === indiceAlvoRef.current) return;

      capturarPosicoesAntes();
      indiceAlvoRef.current = novoIndiceAlvo;
      setIndiceAlvo(novoIndiceAlvo);
    };

    const aoSoltarMouse = () => {
      const origemIndex = questoes.findIndex((q) => q.localId === arrastandoId);
      const destino = indiceAlvoRef.current;
      if (origemIndex !== -1 && destino !== null) {
        moverQuestao(origemIndex, destino);
        // Reaproveita a mesma animação de "entrada" pro card pousar suave na nova posição
        setEntrandoId(arrastandoId);
        setTimeout(() => setEntrandoId(null), 20);
      }
      indiceAlvoRef.current = null;
      setIndiceAlvo(null);
      setArrastandoId(null);
    };

    window.addEventListener("mousemove", aoMoverMouse);
    window.addEventListener("mouseup", aoSoltarMouse);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", aoMoverMouse);
      window.removeEventListener("mouseup", aoSoltarMouse);
    };
  }, [arrastandoId, questoes]);

  // Depois que a lista re-renderiza com os cards em erro, rola até o primeiro e foca no campo vazio
  useEffect(() => {
    if (tentativaInvalida === 0) return;

    const primeiraInvalida = questoes.find((q) => questoesInvalidas[q.localId]);
    if (!primeiraInvalida) return;

    const erro = questoesInvalidas[primeiraInvalida.localId];
    const campo = erro.texto ? "texto" : "resposta";
    const elemento = inputRefs.current[`${primeiraInvalida.localId}-${campo}`];
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });
      elemento.focus();
    }
  }, [tentativaInvalida]);

  const copiarCodigo = async () => {
    if (!codigoAtividade) return;

    try {
      await navigator.clipboard.writeText(codigoAtividade);
    } catch {
      // Alguns navegadores bloqueiam a Clipboard API fora de um contexto focado/seguro — mostra o feedback mesmo assim
    }

    setCodigoCopiado(true);
    setTimeout(() => setCodigoCopiado(false), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const novasInvalidas = {};
    questoes.forEach((questao) => {
      const semTexto = !questao.texto_questao.trim();
      const semResposta = !questao.resposta_certa.trim();
      if (semTexto || semResposta) {
        novasInvalidas[questao.localId] = {
          texto: semTexto,
          resposta: semResposta,
        };
      }
    });

    if (Object.keys(novasInvalidas).length > 0) {
      setQuestoesInvalidas(novasInvalidas);
      setTentativaInvalida((atual) => atual + 1);
      return;
    }

    const urlAtividade = idAtividadeCriada
      ? `${API_URL}/atividade/${idAtividadeCriada}`
      : `${API_URL}/atividade/criar_atividade`;

    const metodoAtividade = idAtividadeCriada ? "PATCH" : "POST";

    const corpoAtividade = {
      titulo: formData.titulo,
      tipo_atividade: formData.tipo_atividade,
      turma_id: formData.turma_id || null,
      descricao: formData.descricao,
      disciplina: formData.disciplina,
      dificuldade: formData.dificuldade,
      imagem_atividade_url: formData.imagem_atividade_url || null,
      quantidade_blocos: formData.quantidade_blocos,
      tempo_limite_seg: formData.tempo_limite_seg || null,
    };

    if (!idAtividadeCriada) {
      corpoAtividade.professor_id = 32; //TODO remover id fixo mais tarde
    }

    const respostaAtividade = await fetch(urlAtividade, {
      method: metodoAtividade,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN_TEMPORARIO}`,
      },
      body: JSON.stringify(corpoAtividade),
    });

    const dadosAtividade = await respostaAtividade.json();

    if (!respostaAtividade.ok) {
      setMensagemErro(dadosAtividade.detail || "Erro ao criar atividade");
      return;
    }

    const atividadeId = idAtividadeCriada || dadosAtividade.id;
    if (dadosAtividade.codigo_atividade) {
      setCodigoAtividade(dadosAtividade.codigo_atividade);
    }

    for (const questao of questoes) {
      const urlQuestao = questao.questaoId
        ? `${API_URL}/questao/${questao.questaoId}`
        : `${API_URL}/questao/criar`;

      const metodoQuestao = questao.questaoId ? "PATCH" : "POST";

      const corpoQuestao = {
        texto_questao: questao.texto_questao,
        tipo_questao: formData.tipo_atividade,
        ordem: questao.ordem,
        pontos: 10,
      };

      if (!questao.questaoId) {
        corpoQuestao.atividade_id = atividadeId;
      }

      const respostaQuestao = await fetch(urlQuestao, {
        method: metodoQuestao,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN_TEMPORARIO}`,
        },
        body: JSON.stringify(corpoQuestao),
      });

      const dadosQuestao = await respostaQuestao.json();

      if (!respostaQuestao.ok) {
        setMensagemErro(
          `Erro na questão ${questao.ordem}: ${dadosQuestao.detail}`,
        );
        return;
      }

      const questaoID = questao.questaoId || dadosQuestao.id;

      const urlOpcao = questao.opcaoId
        ? `${API_URL}/opcao_questao/${questao.opcaoId}`
        : `${API_URL}/opcao_questao/criar`;

      const metodoOpcao = questao.opcaoId ? "PATCH" : "POST";

      const corpoOpcao = {
        texto_opcao: questao.resposta_certa,
      };

      if (!questao.opcaoId) {
        corpoOpcao.questao_id = questaoID;
        corpoOpcao.correta = 1;
      }

      const respostaOpcao = await fetch(urlOpcao, {
        method: metodoOpcao,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN_TEMPORARIO}`,
        },
        body: JSON.stringify(corpoOpcao),
      });

      const dadosOpcao = await respostaOpcao.json();

      if (!respostaOpcao.ok) {
        setMensagemErro(
          `Erro na resposta da questão ${questao.ordem}: ${dadosOpcao.detail}`,
        );
        return;
      }

      setQuestoes((atual) =>
        atual.map((q) =>
          q.ordem === questao.ordem
            ? {
                ...q,
                questaoId: questaoID,
                opcaoId: questao.opcaoId || dadosOpcao.id,
              }
            : q,
        ),
      );
    }

    for (const idParaRemover of questoesParaRemover) {
      const respostaDelete = await fetch(
        `${API_URL}/questao/${idParaRemover}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${TOKEN_TEMPORARIO}`,
          },
        },
      );

      if (!respostaDelete.ok) {
        const dadosDelete = await respostaDelete.json();
        setMensagemErro(`Erro ao remover uma questão: ${dadosDelete.detail}`);
        return;
      }
    }

    setQuestoesParaRemover([]);

    setFoiCriacao(metodoAtividade === "POST");
    setIdAtividadeCriada(atividadeId);
    setMostrarSucesso(true);
  };

  const renderCardQuestao = (questao) => {
    const index = questoes.findIndex((q) => q.localId === questao.localId);
    const erro = questoesInvalidas[questao.localId];

    return (
      <div
        key={questao.localId}
        data-questao-local-id={questao.localId}
        ref={(el) => {
          wrapperRefs.current[questao.localId] = el;
        }}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          removendoId === questao.localId || entrandoId === questao.localId
            ? "max-h-0 opacity-0 scale-95 mb-0"
            : "max-h-[360px] opacity-100 scale-100 mb-3"
        }`}
      >
        <div
          key={erro ? `erro-${tentativaInvalida}` : "ok"}
          ref={(el) => {
            cardRefs.current[questao.localId] = el;
          }}
          className={`bg-branco rounded-2xl p-5 shadow-sm border flex flex-col gap-3 ${
            erro
              ? "border-red-300 animate-tremida-leve"
              : "border-cinza-claro/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-azul/40">
              Questão {questao.ordem}
            </span>
            <div className="flex items-center gap-1">
              <span
                onMouseDown={(e) => iniciarArrasto(e, questao)}
                title="Arraste para reordenar"
                className="w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing text-azul/25 hover:text-azul/60 transition-colors select-none"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <circle cx="5" cy="3" r="1.3" />
                  <circle cx="11" cy="3" r="1.3" />
                  <circle cx="5" cy="8" r="1.3" />
                  <circle cx="11" cy="8" r="1.3" />
                  <circle cx="5" cy="13" r="1.3" />
                  <circle cx="11" cy="13" r="1.3" />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => aoRemoverQuestao(index)}
                disabled={questoes.length <= 1}
                className="w-5 h-5 flex items-center justify-center text-azul/30 hover:text-red-500 disabled:opacity-30 disabled:hover:text-azul/30 transition-colors text-lg leading-none -translate-y-px"
              >
                ×
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-xs font-bold text-red-500 -mt-1.5">
              Questão não pode estar em branco
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Texto da pergunta
            </label>
            <input
              ref={(el) => {
                inputRefs.current[`${questao.localId}-texto`] = el;
              }}
              type="text"
              value={questao.texto_questao}
              onChange={(e) =>
                aoMudarBloco(index, "texto_questao", e.target.value)
              }
              placeholder="Ex: Qual o som que a vaca faz?"
              className={`w-full px-4 py-2.5 rounded-xl border bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 shadow-sm transition-all text-sm ${
                erro?.texto
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                  : "border-cinza-claro/30 focus:ring-coral/20 focus:border-coral/50"
              }`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Resposta certa
            </label>
            <input
              ref={(el) => {
                inputRefs.current[`${questao.localId}-resposta`] = el;
              }}
              type="text"
              value={questao.resposta_certa}
              onChange={(e) =>
                aoMudarBloco(index, "resposta_certa", e.target.value)
              }
              placeholder="Ex: Muuuu"
              className={`w-full px-4 py-2.5 rounded-xl border bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 shadow-sm transition-all text-sm ${
                erro?.resposta
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                  : "border-cinza-claro/30 focus:ring-coral/20 focus:border-coral/50"
              }`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      {/* 1. SIDEBAR (Barra Lateral Esquerda) */}
      <aside className="w-64 bg-[#1e2a38] text-branco flex flex-col justify-between p-6 sticky top-0 h-screen self-start">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <img src="/img/logo.png" alt="Logo" className="w-7 h-7" />
            <span className="font-extrabold tracking-widest text-lg text-branco">
              KIVIRA
            </span>
          </div>

          <nav className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Menu
            </span>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="/professor"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium"
                >
                  • Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/professor/turmas"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium"
                >
                  • Turmas
                </a>
              </li>
              <li>
                <a
                  href="/professor/atividades"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-branco/10 text-branco font-medium transition-all relative"
                >
                  <span className="w-2 h-2 rounded-full bg-coral absolute left-2"></span>
                  <span className="pl-2">Atividades</span>
                </a>
              </li>
              <li>
                <a
                  href="/professor/configuracoes"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium"
                >
                  • Configurações
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-3 border-t border-branco/10 pt-4 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-coral/80 flex items-center justify-center font-bold text-branco shadow-md">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-branco">Professor(a)</span>
            <span className="text-xs text-gray-400">Ver perfil →</span>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link
            to="/professor/atividades"
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            ← Atividades
          </Link>
        </header>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {idAtividadeCriada
              ? `Atividade: ${formData.titulo}`
              : "Nova Atividade"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-6 items-start">
          {/* COLUNA ESQUERDA — dados da atividade */}
          <div className="w-full max-w-sm bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 shrink-0 sticky top-8 mt-7">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Título
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Sons dos Animais"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Disciplina
              </label>
              <input
                type="text"
                name="disciplina"
                value={formData.disciplina}
                onChange={handleChange}
                placeholder="Ex: Ciências"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
              />
            </div>

            <SelectCustom
              label="Turma"
              name="turma_id"
              value={formData.turma_id}
              onChange={handleChange}
              placeholder="Nenhuma (opcional)"
              options={TURMAS_MOCK.map((turma) => ({
                value: String(turma.id),
                label: turma.nome,
              }))}
            />

            <SelectCustom
              label="Tipo de atividade"
              name="tipo_atividade"
              value={formData.tipo_atividade}
              onChange={handleChange}
              options={[
                { value: "arrastar_soltar", label: "Arrastar e soltar" },
                { value: "associacao", label: "Associação" },
                { value: "multipla_escolha", label: "Múltipla escolha" },
              ]}
            />

            <SelectCustom
              label="Dificuldade"
              name="dificuldade"
              value={formData.dificuldade}
              onChange={handleChange}
              options={[
                { value: "facil", label: "Fácil" },
                { value: "medio", label: "Médio" },
                { value: "dificil", label: "Difícil" },
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Uma breve descrição da atividade (opcional)"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Imagem (URL)
              </label>
              <input
                type="text"
                name="imagem_atividade_url"
                value={formData.imagem_atividade_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Código da atividade
              </label>
              {codigoAtividade ? (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 shadow-sm transition-all"
                >
                  <span className="font-mono font-extrabold tracking-widest text-azul text-sm">
                    {codigoAtividade}
                  </span>
                  <span className="text-xs font-bold text-coral">
                    {codigoCopiado ? "Copiado!" : "Copiar"}
                  </span>
                </button>
              ) : (
                <div className="relative group">
                  <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-cinza-claro/10 text-azul/30 shadow-sm cursor-not-allowed">
                    <span className="font-mono font-extrabold tracking-widest text-sm">
                      ••••••••
                    </span>
                    <span className="text-xs font-bold">Copiar</span>
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-azul text-branco text-xs font-medium px-3 py-2 shadow-lg z-10">
                    Salve a atividade pra gerar o código
                    <div className="absolute top-full left-4 w-0 h-0 border-4 border-transparent border-t-azul"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Blocos
                </label>
                <input
                  type="number"
                  name="quantidade_blocos"
                  value={formData.quantidade_blocos}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Tempo (seg)
                </label>
                <input
                  type="number"
                  name="tempo_limite_seg"
                  value={formData.tempo_limite_seg}
                  onChange={handleChange}
                  placeholder="Sem limite"
                  min={0}
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA — questões da atividade, uma por bloco */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Questões ({questoes.length}{" "}
                {questoes.length === 1 ? "bloco" : "blocos"})
              </h4>

              <div className="relative group">
                {idAtividadeCriada ? (
                  <Link
                    to="/jogo"
                    className="btn bg-azul hover:bg-azul/90 text-branco border-none rounded-xl px-5 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 inline-flex items-center gap-2"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M4 2.5v11l10-5.5-10-5.5z" />
                    </svg>
                    Pré-visualizar atividade
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-xl px-5 py-2.5 font-bold text-sm text-azul/30 bg-cinza-claro/10 border-none cursor-not-allowed inline-flex items-center gap-2"
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M4 2.5v11l10-5.5-10-5.5z" />
                    </svg>
                    Pré-visualizar atividade
                  </button>
                )}

                {!idAtividadeCriada && (
                  <div className="pointer-events-none absolute top-full right-0 mt-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-azul text-branco text-xs font-medium px-3 py-2 shadow-lg z-10">
                    Para pré-visualizar é necessário salvar a atividade primeiro
                    <div className="absolute bottom-full right-4 w-0 h-0 border-4 border-transparent border-b-azul"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              {(() => {
                if (!arrastandoId) {
                  return questoes.map((questao) => renderCardQuestao(questao));
                }

                // Enquanto arrasta: mostra a lista sem o card de origem (ele vira o card flutuante)
                // e insere um "buraco" no lugar onde ele cairia se você soltar agora
                const semOrigem = questoes.filter(
                  (q) => q.localId !== arrastandoId,
                );
                const alvo =
                  indiceAlvo === null ? semOrigem.length : indiceAlvo;

                const buraco = (
                  <div
                    key="buraco-preview"
                    ref={(el) => {
                      wrapperRefs.current.__gap__ = el;
                    }}
                    style={{ height: alturaCard }}
                    className="rounded-2xl border-2 border-dashed border-coral/40 bg-coral/5 mb-3 transition-all duration-150"
                  />
                );

                const itens = semOrigem.map((questao) =>
                  renderCardQuestao(questao),
                );
                itens.splice(alvo, 0, buraco);
                return itens;
              })()}
            </div>

            <button
              type="button"
              onClick={aoClicarAdicionar}
              className="w-full border-2 border-dashed border-coral/40 rounded-2xl py-4 flex items-center justify-center gap-2 text-coral font-bold text-sm hover:bg-branco/40 transition-all hover:scale-[1.01] active:scale-95"
            >
              + Adicionar questão
            </button>

            <div className="flex gap-3 justify-end pt-2">
              <Link
                to="/professor/atividades"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-azul/60 hover:bg-azul/5 transition-all"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
              >
                {idAtividadeCriada ? "Atualizar Atividade" : "Criar Atividade"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Card "levantado" da lista enquanto está sendo arrastado — segue o mouse */}
      {arrastandoId &&
        (() => {
          const questaoArrastada = questoes.find(
            (q) => q.localId === arrastandoId,
          );
          if (!questaoArrastada) return null;

          return (
            <div
              className="fixed z-50 pointer-events-none rotate-1"
              style={{
                left: posicaoPointer.x - offsetPointer.x,
                top: posicaoPointer.y - offsetPointer.y,
                width: larguraCard,
              }}
            >
              <div className="bg-branco rounded-2xl p-5 shadow-2xl border border-cinza-claro/10 flex flex-col gap-3 scale-105">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-azul/40">
                    Questão {questaoArrastada.ordem}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Texto da pergunta
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul text-sm truncate">
                    {questaoArrastada.texto_questao || (
                      <span className="text-azul/40">
                        Ex: Qual o som que a vaca faz?
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Resposta certa
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul text-sm truncate">
                    {questaoArrastada.resposta_certa || (
                      <span className="text-azul/40">Ex: Muuuu</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Modal de sucesso ao criar/atualizar a atividade */}
      {mostrarSucesso && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-branco rounded-3xl p-8 shadow-xl flex flex-col items-center gap-3 max-w-sm text-center animate__animated animate__zoomIn">
            <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center text-6xl">
              ✅
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              {foiCriacao
                ? "Atividade criada com sucesso!"
                : "Atividade atualizada com sucesso!"}
            </h3>
            <p className="text-sm text-azul/60">
              "{formData.titulo}" já está salva e pronta pra ser ajustada quando
              você quiser.
            </p>

            {codigoAtividade && (
              <div className="w-full flex flex-col gap-1.5 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Código da atividade
                </span>
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 transition-all group"
                >
                  <span className="font-mono font-extrabold text-lg tracking-widest text-azul">
                    {codigoAtividade}
                  </span>
                  <span className="text-xs font-bold text-coral flex items-center gap-1">
                    {codigoCopiado ? (
                      "Copiado!"
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M4 2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1V3h6a1 1 0 0 0-1-1H4zm3 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H7z" />
                        </svg>
                        Copiar
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMostrarSucesso(false)}
              className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 mt-2"
            >
              Continuar editando
            </button>
          </div>
        </div>
      )}

      {/* Modal de erro — substitui o alert() nativo do navegador */}
      {mensagemErro && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-branco rounded-3xl p-8 shadow-xl flex flex-col items-center gap-3 max-w-sm text-center animate__animated animate__zoomIn">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              Ops, algo deu errado
            </h3>
            <p className="text-sm text-azul/60">{mensagemErro}</p>
            <button
              type="button"
              onClick={() => setMensagemErro(null)}
              className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl px-6 py-2.5 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 mt-2"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
