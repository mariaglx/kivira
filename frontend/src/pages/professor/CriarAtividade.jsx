import { useState, useRef, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Reorder, AnimatePresence, useDragControls } from "motion/react";
import "animate.css";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { useCriarAtividade } from "../../controllers/useCriarAtividade";
import { apiRequest } from "../../services/api";
import { SearchIcon } from "../../components/icons/search";
import { XIcon } from "../../components/icons/x";

// Um card de questão arrastável — precisa ser seu próprio componente pra cada
// um ter seu próprio useDragControls (o "cabo" que a alcinha de arrastar aciona,
// em vez do card inteiro virar arrastável e atrapalhar o clique nos campos)
function QuestaoCard({
  questao,
  index,
  erro,
  tentativaInvalida,
  podeRemover,
  onMudarBloco,
  onRemover,
  registrarInputRef,
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={questao}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
      <div
        key={erro ? `erro-${tentativaInvalida}` : "ok"}
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
              onPointerDown={(e) => dragControls.start(e)}
              title="Arraste para reordenar"
              className="w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing text-azul/25 hover:text-azul/60 transition-colors select-none touch-none"
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
              onClick={() => onRemover(index)}
              disabled={!podeRemover}
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
            ref={(el) => registrarInputRef(`${questao.localId}-texto`, el)}
            type="text"
            value={questao.texto_questao}
            onChange={(e) => onMudarBloco(index, "texto_questao", e.target.value)}
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
            ref={(el) => registrarInputRef(`${questao.localId}-resposta`, el)}
            type="text"
            value={questao.resposta_certa}
            onChange={(e) => onMudarBloco(index, "resposta_certa", e.target.value)}
            placeholder="Ex: Muuuu"
            className={`w-full px-4 py-2.5 rounded-xl border bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 shadow-sm transition-all text-sm ${
              erro?.resposta
                ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                : "border-cinza-claro/30 focus:ring-coral/20 focus:border-coral/50"
            }`}
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

// Monta a lista de números de página a mostrar, sempre com a primeira e a última
// visíveis e "..." no lugar do que fica longe da página atual — evita uma barra
// gigante quando o Pixabay devolve muitas páginas (até 25, no limite da API)
function gerarPaginasVisiveis(paginaAtual, totalPaginas) {
  const vizinhanca = 1;
  const paginas = [];

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    const ehBorda = pagina === 1 || pagina === totalPaginas;
    const ehVizinha = Math.abs(pagina - paginaAtual) <= vizinhanca;

    if (ehBorda || ehVizinha) {
      paginas.push(pagina);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return paginas;
}

export function CriarAtividade() {
  const { id: idRota } = useParams();
  const { state } = useLocation();
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
    gerandoIA,
    erroIA,
    setErroIA,
    modalImagemAberto,
    abrirBuscaImagem,
    fecharBuscaImagem,
    termoBuscaImagem,
    setTermoBuscaImagem,
    imagensPixabay,
    buscandoImagens,
    erroBuscaImagem,
    setErroBuscaImagem,
    buscarImagensPixabay,
    selecionarImagemPixabay,
    paginaAtual,
    totalPaginasImagens,
    irParaPaginaImagem,
    gerarQuestoesComIA,
    abaImagem,
    setAbaImagem,
    enviandoImagem,
    erroUploadImagem,
    setErroUploadImagem,
    enviarImagemDoComputador,
  } = useCriarAtividade();
  const [turmas, setTurmas] = useState([]);
  const [erroTurmas, setErroTurmas] = useState(null);
  const [idAtividadeCriada, setIdAtividadeCriada] = useState(null);
  const [codigoAtividade, setCodigoAtividade] = useState(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [foiCriacao, setFoiCriacao] = useState(true);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoEdicao, setCarregandoEdicao] = useState(!!idRota);
  const [questoesInvalidas, setQuestoesInvalidas] = useState({});
  const [tentativaInvalida, setTentativaInvalida] = useState(0);
  const inputRefs = useRef({});
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

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

  // Reordena por arrastar (Reorder, da motion) — recebe o array já na nova ordem
  // e só precisa renumerar o campo "ordem" de cada questão
  const handleReorder = (novaOrdem) => {
    setQuestoes(novaOrdem.map((q, i) => ({ ...q, ordem: i + 1 })));
  };

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

  // Carrega as turmas do professor logado assim que a tela abre
  useEffect(() => {
    apiRequest("/turma/")
      .then(setTurmas)
      .catch((erro) => setErroTurmas(erro.message));
  }, []);

  // Veio de "+ Nova atividade" de dentro de uma turma (TurmaForm.jsx) — a
  // turma já chega pré-selecionada, só se aplica na criação (edição carrega
  // a turma real da própria atividade no efeito de baixo)
  useEffect(() => {
    if (!idRota && state?.turmaIdPadrao) {
      setFormData((atual) => ({ ...atual, turma_id: String(state.turmaIdPadrao) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modo edição: a rota veio com um :id (botão "Editar" da lista de atividades) —
  // carrega a atividade e as questões já existentes pra dentro do formulário
  useEffect(() => {
    if (!idRota) return;

    let cancelado = false;

    Promise.all([
      apiRequest(`/atividade/${idRota}`),
      apiRequest(`/atividade/${idRota}/questoes`),
    ])
      .then(([atividade, dadosQuestoes]) => {
        if (cancelado) return;

        const questoesCarregadas = dadosQuestoes.questoes.map((q) => {
          const opcaoCorreta =
            q.opcoes.find((o) => o.correta) || q.opcoes[0] || null;
          return {
            localId: crypto.randomUUID(),
            ordem: q.ordem,
            texto_questao: q.texto_questao,
            resposta_certa: opcaoCorreta?.texto_opcao || "",
            questaoId: q.id,
            opcaoId: opcaoCorreta?.id || null,
          };
        });

        setFormData((atual) => ({
          ...atual,
          titulo: atividade.titulo || "",
          tipo_atividade: atividade.tipo_atividade || "arrastar_soltar",
          turma_id: atividade.turma_id ? String(atividade.turma_id) : "",
          descricao: atividade.descricao || "",
          disciplina: atividade.disciplina || "",
          dificuldade: atividade.dificuldade || "facil",
          imagem_atividade_url: atividade.imagem_atividade_url || "",
          // Se já existem questões salvas, o número de blocos precisa bater com
          // elas (senão o campo "Blocos" mostra um número que não confere com
          // os cards de questão exibidos abaixo)
          quantidade_blocos:
            questoesCarregadas.length || atividade.quantidade_blocos,
          tempo_limite_seg: atividade.tempo_limite_seg || "",
        }));

        if (questoesCarregadas.length > 0) setQuestoes(questoesCarregadas);
        setIdAtividadeCriada(atividade.id);
        if (atividade.codigo_atividade) setCodigoAtividade(atividade.codigo_atividade);
      })
      .catch((erro) => setMensagemErro(erro.message || "Não foi possível carregar a atividade"))
      .finally(() => {
        if (!cancelado) setCarregandoEdicao(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idRota, setFormData, setQuestoes]);

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

    // Trava contra duplo clique/duplo submit: sem isso, um clique repetido enquanto
    // a primeira chamada ainda está em voo cria uma atividade nova a cada clique
    // (foi exatamente isso que gerou várias atividades idênticas e incompletas no banco)
    if (salvando) return;

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

    setSalvando(true);
    try {

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

    let dadosAtividade;
    try {
      dadosAtividade = await apiRequest(
        idAtividadeCriada
          ? `/atividade/${idAtividadeCriada}`
          : "/atividade/criar_atividade",
        {
          method: idAtividadeCriada ? "PATCH" : "POST",
          data: corpoAtividade,
        },
      );
    } catch (erro) {
      setMensagemErro(erro.message || "Erro ao criar atividade");
      return;
    }

    const atividadeId = idAtividadeCriada || dadosAtividade.id;
    if (dadosAtividade.codigo_atividade) {
      setCodigoAtividade(dadosAtividade.codigo_atividade);
    }

    for (const questao of questoes) {
      const corpoQuestao = {
        texto_questao: questao.texto_questao,
        tipo_questao: formData.tipo_atividade,
        ordem: questao.ordem,
        pontos: 10,
      };

      if (!questao.questaoId) {
        corpoQuestao.atividade_id = atividadeId;
      }

      let dadosQuestao;
      try {
        dadosQuestao = await apiRequest(
          questao.questaoId ? `/questao/${questao.questaoId}` : "/questao/criar",
          {
            method: questao.questaoId ? "PATCH" : "POST",
            data: corpoQuestao,
          },
        );
      } catch (erro) {
        setMensagemErro(`Erro na questão ${questao.ordem}: ${erro.message}`);
        return;
      }

      const questaoID = questao.questaoId || dadosQuestao.id;

      const corpoOpcao = {
        texto_opcao: questao.resposta_certa,
      };

      if (!questao.opcaoId) {
        corpoOpcao.questao_id = questaoID;
        corpoOpcao.correta = 1;
      }

      let dadosOpcao;
      try {
        dadosOpcao = await apiRequest(
          questao.opcaoId
            ? `/opcao_questao/${questao.opcaoId}`
            : "/opcao_questao/criar",
          {
            method: questao.opcaoId ? "PATCH" : "POST",
            data: corpoOpcao,
          },
        );
      } catch (erro) {
        setMensagemErro(
          `Erro na resposta da questão ${questao.ordem}: ${erro.message}`,
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
      try {
        await apiRequest(`/questao/${idParaRemover}`, { method: "DELETE" });
      } catch (erro) {
        setMensagemErro(`Erro ao remover uma questão: ${erro.message}`);
        return;
      }
    }

    setQuestoesParaRemover([]);

    setFoiCriacao(!idAtividadeCriada);
    setIdAtividadeCriada(atividadeId);
    setMostrarSucesso(true);
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoEdicao) {
    return (
      <main className="flex-1 p-8">
        <p className="text-azul/60">Carregando atividade...</p>
      </main>
    );
  }

  return (
    <>
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

            <div className="grid grid-cols-2 gap-3">
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

              <div className="flex flex-col gap-1.5">
                <SelectCustom
                  label="Turma"
                  name="turma_id"
                  value={formData.turma_id}
                  onChange={handleChange}
                  placeholder="Nenhuma (opcional)"
                  options={turmas.map((turma) => ({
                    value: String(turma.id),
                    label: turma.nome,
                  }))}
                />
                {erroTurmas && (
                  <p className="text-[11px] text-red-500">
                    Não foi possível carregar: {erroTurmas}
                  </p>
                )}
              </div>
            </div>

            <hr className="m-0 border-t border-cinza-claro/60" />

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <hr className="m-0 border-t border-cinza-claro/60" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Imagem da atividade
              </label>
              <div className="flex gap-2 items-center">
                {formData.imagem_atividade_url ? (
                  <div className="relative group w-11 h-11 shrink-0">
                    <img
                      src={formData.imagem_atividade_url}
                      alt="Prévia da imagem escolhida"
                      className="w-11 h-11 rounded-xl object-cover border border-cinza-claro/30"
                    />
                    <button
                      type="button"
                      aria-label="Remover imagem"
                      onClick={() =>
                        setFormData((atual) => ({ ...atual, imagem_atividade_url: "" }))
                      }
                      className="absolute inset-0 rounded-xl bg-azul/50 text-branco flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon size={16} isAnimated={false} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirBuscaImagem("enviar")}
                    aria-label="Enviar imagem do computador"
                    className="group relative w-11 h-11 rounded-xl border border-dashed border-cinza-claro/50 hover:border-coral/50 shrink-0 flex items-center justify-center text-azul/25 hover:text-coral transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-hover:opacity-0 transition-opacity"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                      <path d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V11.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => abrirBuscaImagem("buscar")}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul/60 hover:bg-bege/40 shadow-sm transition-all text-sm text-left truncate inline-flex items-center gap-2"
                >
                  <SearchIcon size={14} isAnimated={false} />
                  {formData.imagem_atividade_url ? "Trocar imagem" : "Escolher imagem"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Código da atividade
              </label>
              {codigoAtividade ? (
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco hover:bg-bege/40 shadow-sm transition-all"
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

            <hr className="m-0 border-t border-cinza-claro/60" />

            <button
              type="button"
              onClick={() => setMostrarDetalhes((atual) => !atual)}
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-azul/55 hover:text-azul/80 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-3.5 h-3.5 transition-transform ${mostrarDetalhes ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
              {mostrarDetalhes ? "Menos detalhes" : "Mais detalhes"}
            </button>

            {mostrarDetalhes && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Série/Ano
                  </label>
                  <input
                    type="text"
                    name="serie_ano"
                    value={formData.serie_ano}
                    onChange={handleChange}
                    placeholder="Ex: 3º ano do Ensino Fundamental"
                    className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                  />
                  <p className="text-[11px] text-azul/40">
                    Usado apenas como contexto para a geração por IA.
                  </p>
                </div>

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
              </>
            )}

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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={gerarQuestoesComIA}
                  disabled={gerandoIA}
                  className="rounded-xl px-5 py-2.5 font-bold text-sm text-coral bg-coral/10 hover:bg-coral/20 disabled:opacity-50 disabled:cursor-not-allowed border-none transition-all inline-flex items-center gap-2"
                >
                  {gerandoIA ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-coral/40 border-t-coral rounded-full animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>✨ Gerar com IA</>
                  )}
                </button>

              <div className="relative group">
                {idAtividadeCriada ? (
                  <Link
                    to="/jogo"
                    state={{ atividadeId: idAtividadeCriada }}
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
            </div>

            {erroIA && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                <span>{erroIA}</span>
                <button
                  type="button"
                  onClick={() => setErroIA(null)}
                  className="font-bold hover:text-red-800"
                >
                  ×
                </button>
              </div>
            )}

            <Reorder.Group
              as="div"
              axis="y"
              values={questoes}
              onReorder={handleReorder}
              className="flex flex-col"
            >
              <AnimatePresence initial={false}>
                {questoes.map((questao, index) => (
                  <QuestaoCard
                    key={questao.localId}
                    questao={questao}
                    index={index}
                    erro={questoesInvalidas[questao.localId]}
                    tentativaInvalida={tentativaInvalida}
                    podeRemover={questoes.length > 1}
                    onMudarBloco={aoMudarBloco}
                    onRemover={removerQuestao}
                    registrarInputRef={(chave, el) => {
                      inputRefs.current[chave] = el;
                    }}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            <button
              type="button"
              onClick={() => adicionarQuestao()}
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
                disabled={salvando}
                className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {salvando
                  ? "Salvando..."
                  : idAtividadeCriada
                    ? "Atualizar Atividade"
                    : "Criar Atividade"}
              </button>
            </div>
          </div>
        </form>
      </main>

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

      {/* Modal de escolha de imagem: buscar no Pixabay ou enviar do computador */}
      {modalImagemAberto && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-branco rounded-3xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div role="tablist" className="tabs tabs-box bg-bege/60 rounded-2xl w-fit flex-nowrap p-0">
                <button
                  type="button"
                  role="tab"
                  onClick={() => setAbaImagem("buscar")}
                  className={`tab gap-2 rounded-2xl ${abaImagem === "buscar" ? "tab-active bg-coral text-branco font-bold" : ""}`}
                >
                  Buscar imagem
                </button>
                <button
                  type="button"
                  role="tab"
                  onClick={() => setAbaImagem("enviar")}
                  className={`tab gap-2 rounded-2xl ${abaImagem === "enviar" ? "tab-active bg-coral text-branco font-bold" : ""}`}
                >
                  Enviar arquivo
                </button>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={fecharBuscaImagem}
                className="btn btn-ghost btn-sm btn-circle text-azul/60"
              >
                <XIcon size={16} isAnimated={false} />
              </button>
            </div>

            {abaImagem === "buscar" && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    buscarImagensPixabay();
                  }}
                  className="flex gap-2 mb-3"
                >
                  <input
                    type="text"
                    value={termoBuscaImagem}
                    onChange={(e) => setTermoBuscaImagem(e.target.value)}
                    placeholder="Ex: gato, escola, números..."
                    autoFocus
                    className="flex-1 px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={buscandoImagens || !termoBuscaImagem.trim()}
                    className="shrink-0 rounded-xl px-4 py-2.5 font-bold text-sm text-branco bg-coral hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed border-none transition-all inline-flex items-center justify-center"
                  >
                    {buscandoImagens ? (
                      <span className="w-3.5 h-3.5 border-2 border-branco/40 border-t-branco rounded-full animate-spin" />
                    ) : (
                      <SearchIcon size={16} isAnimated={false} />
                    )}
                  </button>
                </form>

                {erroBuscaImagem && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 mb-4">
                    <span>{erroBuscaImagem}</span>
                    <button
                      type="button"
                      onClick={() => setErroBuscaImagem(null)}
                      className="font-bold hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {imagensPixabay.length === 0 && !buscandoImagens && !erroBuscaImagem && (
                    <p className="col-span-3 text-sm text-azul/40 text-center py-8">
                      Busque um termo pra ver as imagens.
                    </p>
                  )}
                  {imagensPixabay.map((imagem) => (
                    <button
                      key={imagem.id}
                      type="button"
                      onClick={() => selecionarImagemPixabay(imagem.url_imagem)}
                      aria-label={`Selecionar imagem: ${imagem.tags}`}
                      className={`aspect-square rounded-xl overflow-hidden transition ${
                        formData.imagem_atividade_url === imagem.url_imagem
                          ? "ring-4 ring-coral"
                          : "ring-2 ring-transparent hover:ring-coral/40"
                      }`}
                    >
                      <img
                        src={imagem.url_preview}
                        alt={imagem.tags}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {totalPaginasImagens > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => irParaPaginaImagem(paginaAtual - 1)}
                      disabled={paginaAtual === 1 || buscandoImagens}
                      className="btn btn-sm btn-ghost text-azul/60 disabled:opacity-30"
                    >
                      ‹
                    </button>

                    {gerarPaginasVisiveis(paginaAtual, totalPaginasImagens).map(
                      (pagina, indice) =>
                        pagina === "..." ? (
                          <span
                            key={`reticencias-${indice}`}
                            className="px-1 text-azul/40 text-sm select-none"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={pagina}
                            type="button"
                            onClick={() => irParaPaginaImagem(pagina)}
                            disabled={buscandoImagens}
                            className={`btn btn-sm border-none ${
                              pagina === paginaAtual
                                ? "bg-coral text-branco"
                                : "btn-ghost text-azul/60"
                            }`}
                          >
                            {pagina}
                          </button>
                        )
                    )}

                    <button
                      type="button"
                      onClick={() => irParaPaginaImagem(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginasImagens || buscandoImagens}
                      className="btn btn-sm btn-ghost text-azul/60 disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}

            {abaImagem === "enviar" && (
              <div className="flex flex-col gap-4">
                {erroUploadImagem && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                    <span>{erroUploadImagem}</span>
                    <button
                      type="button"
                      onClick={() => setErroUploadImagem(null)}
                      className="font-bold hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                )}

                <label
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-10 cursor-pointer transition-colors ${
                    enviandoImagem
                      ? "border-cinza-claro/40 bg-cinza-claro/5 cursor-wait"
                      : "border-coral/40 hover:bg-coral/5"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={enviandoImagem}
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (arquivo) enviarImagemDoComputador(arquivo);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                  {enviandoImagem ? (
                    <>
                      <span className="w-6 h-6 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
                      <span className="text-sm font-bold text-azul/50">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-6 h-6 text-coral">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                        <path d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V11.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708z" />
                      </svg>
                      <span className="text-sm font-bold text-azul">Clique pra escolher um arquivo</span>
                      <span className="text-xs text-azul/40">JPEG, PNG, WEBP ou GIF — até 5MB</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
