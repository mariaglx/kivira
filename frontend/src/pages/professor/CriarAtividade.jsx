import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { Reorder, AnimatePresence, useDragControls } from "motion/react";
import "animate.css";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { useCriarAtividade } from "../../controllers/useCriarAtividade";
import { useFecharComEsc } from "../../controllers/useFecharComEsc";
import { apiRequest } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Animacao";
import { Carregando } from "../../components/ui/Carregando";
import { comemorar } from "../../utils/comemorar";
import { corDisciplina, nomeDisciplina } from "../../utils/disciplina";
import { DIFICULDADE_PROFESSOR } from "../../utils/dificuldade";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Ellipsis,
  GripVertical,
  HandGrab,
  Image as IconeImagem,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { Alerta } from "../../components/ui/Alerta";

const CLASSE_CAMPO =
  "w-full px-4 py-2.5 rounded-xl border bg-branco text-azul placeholder:text-azul/75 shadow-sm transition-all text-sm";
const SEM_SETINHAS =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// Alcinha de arrastar pra reordenar (Reorder, da motion). Só ela aciona o
// arraste, senão o clique pra abrir a questão e os campos viravam arrasto.
function AlcaArrastar({ dragControls }) {
  return (
    <span
      onPointerDown={(e) => dragControls.start(e)}
      title="Arraste para reordenar"
      className="w-8 h-11 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-azul/40 hover:text-azul/80 transition-colors select-none touch-none"
    >
      <GripVertical size={18} aria-hidden="true" />
    </span>
  );
}

// Uma questão da lista. Fechada é uma linha compacta (número, pergunta e a
// resposta certa em verde); só a que está em edição abre com os campos.
// Precisa ser seu próprio componente pra cada uma ter seu useDragControls.
function QuestaoLinha({
  questao,
  index,
  erro,
  tentativaInvalida,
  editando,
  podeRemover,
  onEditar,
  onMudarBloco,
  onRemover,
  registrarInputRef,
}) {
  const dragControls = useDragControls();
  const idErro = `erro-${questao.localId}`;

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
      className="mb-2.5"
    >
      {editando ? (
        <div
          key={erro ? `erro-${tentativaInvalida}` : "ok"}
          className={`bg-branco rounded-2xl shadow-sm border-2 p-3 sm:p-4 flex flex-col gap-3 ${
            erro ? "border-vermelho/60 animate-tremida-leve" : "border-coral"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-coral text-azul-escuro font-bold text-sm flex items-center justify-center shrink-0">
              {questao.ordem}
            </span>
            <span className="flex-1 min-w-0 text-sm font-bold text-azul/80">Editando</span>
            <button
              type="button"
              onClick={() => onRemover(index)}
              disabled={!podeRemover}
              aria-label={`Excluir questão ${questao.ordem}`}
              className="alvo-toque w-9 h-9 rounded-full flex items-center justify-center text-vermelho hover:bg-vermelho/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              onClick={() => onEditar(null, questao.localId)}
              aria-expanded="true"
              aria-label={`Recolher questão ${questao.ordem}`}
              className="alvo-toque w-9 h-9 rounded-full flex items-center justify-center text-azul/80 hover:bg-azul/5 transition-colors"
            >
              <ChevronUp size={18} />
            </button>
            <AlcaArrastar dragControls={dragControls} />
          </div>

          {erro && (
            <p id={idErro} className="text-xs font-bold text-vermelho -mt-1">
              Questão não pode estar em branco
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor={`pergunta-${questao.localId}`} className="rotulo">
                Pergunta
              </label>
              <input
                id={`pergunta-${questao.localId}`}
                ref={(el) => registrarInputRef(`${questao.localId}-texto`, el)}
                type="text"
                aria-invalid={!!erro?.texto}
                aria-describedby={erro?.texto ? idErro : undefined}
                value={questao.texto_questao}
                onChange={(e) => onMudarBloco(index, "texto_questao", e.target.value)}
                placeholder="Ex: Qual o som que a vaca faz?"
                className={`${CLASSE_CAMPO} ${
                  erro?.texto ? "border-vermelho/40 focus:border-vermelho" : "border-cinza-claro/30"
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor={`resposta-${questao.localId}`} className="rotulo">
                Resposta certa
              </label>
              <input
                id={`resposta-${questao.localId}`}
                ref={(el) => registrarInputRef(`${questao.localId}-resposta`, el)}
                type="text"
                aria-invalid={!!erro?.resposta}
                aria-describedby={erro?.resposta ? idErro : undefined}
                value={questao.resposta_certa}
                onChange={(e) => onMudarBloco(index, "resposta_certa", e.target.value)}
                placeholder="Ex: Muuuu"
                className={`${CLASSE_CAMPO} ${
                  erro?.resposta ? "border-vermelho/40 focus:border-vermelho" : "border-cinza-claro/30"
                }`}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          key={erro ? `erro-${tentativaInvalida}` : "ok"}
          className={`bg-branco rounded-2xl shadow-sm border flex items-center gap-1 pr-1 ${
            erro ? "border-vermelho/40 animate-tremida-leve" : "border-cinza-claro/30"
          }`}
        >
          <button
            type="button"
            ref={(el) => registrarInputRef(`${questao.localId}-linha`, el)}
            onClick={() => onEditar(questao.localId)}
            aria-expanded="false"
            aria-describedby={erro ? idErro : undefined}
            className="flex-1 min-w-0 min-h-11 flex items-center gap-3 p-3 sm:px-4 text-left rounded-2xl hover:bg-bege/30 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-bege text-azul font-bold text-sm flex items-center justify-center shrink-0">
              <span className="sr-only">Editar questão </span>
              {questao.ordem}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`block text-sm font-bold break-words ${
                  questao.texto_questao ? "text-azul" : "text-azul/80 italic"
                }`}
              >
                {questao.texto_questao || "Pergunta em branco"}
              </span>
              {questao.resposta_certa && (
                <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-verde-texto break-words">
                  <Check size={14} className="shrink-0" aria-hidden="true" />
                  <span className="sr-only">Resposta certa: </span>
                  {questao.resposta_certa}
                </span>
              )}
              {erro && (
                <span id={idErro} className="mt-0.5 block text-xs font-bold text-vermelho">
                  Questão não pode estar em branco
                </span>
              )}
            </span>
          </button>
          <AlcaArrastar dragControls={dragControls} />
        </div>
      )}
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

// Texto que representa o conteúdo editável da atividade, usado pra saber se
// sobrou alteração pendente. O `localId` das questões fica de fora de propósito:
// é identificador só do cliente e muda sozinho, o que faria a tela achar que
// houve mudança quando não houve.
function instantaneoDaAtividade(dados, listaQuestoes) {
  return JSON.stringify({
    dados,
    questoes: listaQuestoes.map((q) => ({
      ordem: q.ordem,
      texto_questao: q.texto_questao,
      resposta_certa: q.resposta_certa,
      questaoId: q.questaoId ?? null,
      opcaoId: q.opcaoId ?? null,
    })),
  });
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
    urlPixabaySelecionada,
    setErroUploadImagem,
    enviarImagemDoComputador,
  } = useCriarAtividade();
  const navigate = useNavigate();
  const [turmas, setTurmas] = useState([]);
  const [erroTurmas, setErroTurmas] = useState(null);
  const [idAtividadeCriada, setIdAtividadeCriada] = useState(null);
  const [codigoAtividade, setCodigoAtividade] = useState(null);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [mostrarSucesso, setMostrarSucesso] = useState(false);
  const [foiCriacao, setFoiCriacao] = useState(true);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoEdicao, setCarregandoEdicao] = useState(!!idRota);
  const [questoesInvalidas, setQuestoesInvalidas] = useState({});
  const [tentativaInvalida, setTentativaInvalida] = useState(0);
  const inputRefs = useRef({});

  // Só uma questão fica aberta por vez. Atividade nova já abre a primeira
  // (estão todas em branco); na edição todas começam fechadas.
  const [questaoEditando, setQuestaoEditando] = useState(() =>
    idRota ? null : questoes[0]?.localId ?? null,
  );

  // Menu de três pontos (Excluir) — fecha no Esc, clique fora ou ao escolher
  const [menuAberto, setMenuAberto] = useState(false);
  const refBotaoMenu = useRef(null);
  const fecharMenu = useCallback(() => setMenuAberto(false), []);
  useFecharComEsc(menuAberto, fecharMenu, refBotaoMenu);

  // Foto do estado como ele veio do banco (ou do último salvamento). Serve pra
  // saber se sobrou alteração pendente e pro "Desfazer" voltar a ele.
  const [estadoOriginal, setEstadoOriginal] = useState(null);
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

  // Abre uma questão (e põe o foco na pergunta) ou, com null, fecha a aberta e
  // devolve o foco pra linha dela — senão o foco cai no <body> quando os
  // campos somem. O foco espera o próximo quadro, quando os campos já existem.
  const editarQuestao = (localId, localIdFechada) => {
    setQuestaoEditando(localId);
    const chave = localId ? `${localId}-texto` : `${localIdFechada}-linha`;
    requestAnimationFrame(() => inputRefs.current[chave]?.focus());
  };

  const aoAdicionarQuestao = () => {
    const nova = adicionarQuestao();
    editarQuestao(nova.localId);
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
    const controller = new AbortController();

    apiRequest("/turma/", { signal: controller.signal })
      .then(setTurmas)
      .catch((erro) => {
        if (erro.name !== "AbortError") setErroTurmas(erro.message);
      });

    return () => controller.abort();
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
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    Promise.all([
      apiRequest(`/atividade/${idRota}`, opcoesFetch),
      apiRequest(`/atividade/${idRota}/questoes`, opcoesFetch),
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
          // Já mostra com acento ("Matematica" vira "Matemática"); só vai pro
          // banco assim se o professor salvar
          disciplina: nomeDisciplina(atividade.disciplina),
          dificuldade: atividade.dificuldade || "facil",
          imagem_atividade_url: atividade.imagem_atividade_url || "",
          tempo_limite_seg: atividade.tempo_limite_seg || "",
        }));

        if (questoesCarregadas.length > 0) setQuestoes(questoesCarregadas);
        setIdAtividadeCriada(atividade.id);
        if (atividade.codigo_atividade) setCodigoAtividade(atividade.codigo_atividade);
      })
      .catch((erro) => {
        if (erro.name === "AbortError") return;
        setMensagemErro(erro.message || "Não foi possível carregar a atividade");
      })
      .finally(() => {
        if (!cancelado) setCarregandoEdicao(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
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
      // Abre a primeira questão com erro, pro efeito de validação achar o campo
      setQuestaoEditando(questoes.find((q) => novasInvalidas[q.localId]).localId);
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
      // Um bloco por questão: o número vem da lista, não de um campo à parte
      quantidade_blocos: questoes.length,
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

    // Salva todas as questões (+ respostas) numa única requisição — antes era
    // 1 POST/PATCH por questão + 1 POST/PATCH por opção, em série (até 24
    // requests pros 12 blocos padrão, ~50s no fim a fim contra o banco na nuvem).
    let respostaQuestoes;
    try {
      respostaQuestoes = await apiRequest(`/atividade/${atividadeId}/questoes`, {
        method: "PUT",
        data: {
          questoes: questoes.map((questao) => ({
            questao_id: questao.questaoId || null,
            opcao_id: questao.opcaoId || null,
            texto_questao: questao.texto_questao,
            ordem: questao.ordem,
            pontos: 10,
            resposta_certa: questao.resposta_certa,
          })),
          remover_questao_ids: questoesParaRemover,
        },
      });
    } catch (erro) {
      setMensagemErro(erro.message || "Erro ao salvar as questões");
      return;
    }

    const idsPorOrdem = new Map(
      respostaQuestoes.questoes.map((q) => [q.ordem, q]),
    );
    const comIdsSalvos = (q) => {
      const salva = idsPorOrdem.get(q.ordem);
      return salva
        ? { ...q, questaoId: salva.questao_id, opcaoId: salva.opcao_id }
        : q;
    };
    setQuestoes((atual) => atual.map(comIdsSalvos));

    setQuestoesParaRemover([]);

    // Acabou de salvar: o que está na tela passa a ser o novo "original" (já
    // com os ids que o banco devolveu, senão questão nova pareceria alterada)
    const questoesSalvas = questoes.map(comIdsSalvos);
    setEstadoOriginal({
      dados: formData,
      questoes: questoesSalvas,
      texto: instantaneoDaAtividade(formData, questoesSalvas),
    });

    setFoiCriacao(!idAtividadeCriada);
    setIdAtividadeCriada(atividadeId);
    setMostrarSucesso(true);
    comemorar();
    } finally {
      setSalvando(false);
    }
  };

  if (carregandoEdicao) {
    return (
      <Carregando texto="Carregando atividade..." />
    );
  }

  const emEdicao = Boolean(idRota);
  const instantaneoAtual = instantaneoDaAtividade(formData, questoes);

  // Primeira renderização depois do carregamento: guarda o estado que veio do
  // banco. Ajuste durante a renderização (e não em efeito) porque a condição
  // deixa de ser verdadeira na renderização seguinte, sem virar laço.
  // Guarda os objetos inteiros, não só o texto: o texto serve pra comparar, mas
  // desfazer precisa das questões completas (inclusive o localId, que a
  // comparação descarta).
  if (emEdicao && estadoOriginal === null) {
    setEstadoOriginal({ dados: formData, questoes, texto: instantaneoAtual });
  }

  // Sem "original" (atividade nova ainda não salva) tudo é novidade
  const houveAlteracao =
    estadoOriginal === null || instantaneoAtual !== estadoOriginal.texto;

  // Volta pro estado do banco/último salvamento — o professor fica onde está
  const desfazerAlteracoes = () => {
    if (!estadoOriginal) return;
    setFormData(estadoOriginal.dados);
    setQuestoes(estadoOriginal.questoes);
    // Questões que ele tinha marcado pra excluir deixam de estar marcadas,
    // senão um salvamento futuro apagaria questões que "voltaram"
    setQuestoesParaRemover([]);
    setQuestoesInvalidas({});
    setMensagemErro(null);
  };

  const abrirExclusao = () => setModalExclusaoAberto(true);
  const fecharExclusao = () => setModalExclusaoAberto(false);

  const excluirAtividade = async () => {
    setExcluindo(true);
    try {
      await apiRequest(`/atividade/${idAtividadeCriada}`, { method: "DELETE" });
      navigate("/professor/atividades");
    } catch (err) {
      setModalExclusaoAberto(false);
      setMensagemErro(err.message || "Não foi possível excluir a atividade");
    } finally {
      setExcluindo(false);
    }
  };

  const corDaDisciplina = corDisciplina(formData.disciplina);

  return (
    <>
      <main className="pagina flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link
            to="/professor/atividades"
            className="alvo-toque inline-flex items-center gap-1.5 text-sm font-bold text-azul/80 hover:text-azul"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Atividades
          </Link>

          <h1 className="sr-only">
            {idAtividadeCriada ? `Editar atividade ${formData.titulo}` : "Nova atividade"}
          </h1>

          {idAtividadeCriada && (
            <div className="relative">
              <button
                ref={refBotaoMenu}
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                aria-expanded={menuAberto}
                aria-label="Mais ações"
                className="w-11 h-11 rounded-full flex items-center justify-center text-azul hover:bg-azul/5 transition-colors"
              >
                <Ellipsis size={22} />
              </button>

              {menuAberto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={fecharMenu} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-branco rounded-2xl shadow-xl border border-cinza-claro/40 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        fecharMenu();
                        abrirExclusao();
                      }}
                      className="w-full min-h-11 flex items-center gap-2 rounded-xl px-3 text-sm font-bold text-vermelho hover:bg-vermelho/10 transition-colors"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Excluir atividade
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <form
          id="form-atividade"
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start"
        >
          {/* COLUNA ESQUERDA — capa, identidade e configuração */}
          <div className="w-full lg:max-w-xs shrink-0 flex flex-col gap-3 lg:sticky lg:top-8">
            {/* 1. Imagem do jogo + código. A "capa" é a mesma imagem que vai pro
                tabuleiro (imagem_atividade_url), buscada no Pixabay ou enviada do
                computador — as duas passam pelo Cloudinary no backend. */}
            <section aria-label="Imagem do jogo e código" className="cartao overflow-hidden">
              {formData.imagem_atividade_url ? (
                <div className="relative h-40 bg-bege">
                  <img src={formData.imagem_atividade_url} alt="Imagem do jogo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remover imagem do jogo"
                    onClick={() =>
                      setFormData((atual) => ({ ...atual, imagem_atividade_url: "" }))
                    }
                    className="alvo-toque absolute top-2 right-2 w-9 h-9 rounded-full bg-branco/90 text-azul shadow-sm flex items-center justify-center hover:text-vermelho transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => abrirBuscaImagem("buscar")}
                  className="m-3 mb-0 h-36 w-[calc(100%-1.5rem)] rounded-xl border-2 border-dashed border-coral/60 bg-bege/40 flex flex-col items-center justify-center gap-1 text-center px-4 hover:bg-bege/70 transition-colors"
                >
                  <IconeImagem size={28} className="text-coral-texto" aria-hidden="true" />
                  <span className="font-display font-extrabold text-coral-texto">Escolher imagem do jogo</span>
                  <span className="text-xs text-azul/80">Ela aparece no tabuleiro e no card da atividade</span>
                </button>
              )}

              <div className="px-4 pt-2 pb-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="rotulo w-full mb-0">Imagem do jogo</span>
                <button
                  type="button"
                  onClick={() => abrirBuscaImagem("buscar")}
                  className="alvo-toque inline-flex items-center gap-1.5 text-sm font-bold text-coral-texto hover:underline"
                >
                  <Search size={15} aria-hidden="true" />
                  {formData.imagem_atividade_url ? "Trocar" : "Buscar"}
                </button>
                <button
                  type="button"
                  onClick={() => abrirBuscaImagem("enviar")}
                  className="alvo-toque inline-flex items-center gap-1.5 text-sm font-bold text-coral-texto hover:underline"
                >
                  <Upload size={15} aria-hidden="true" />
                  Enviar do computador
                </button>
              </div>

              <div className="px-4 pb-2.5 pt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-cinza-claro mt-1.5">
                <span className="text-xs font-bold text-azul/80">Código</span>

                {codigoAtividade ? (
                  <button
                    type="button"
                    onClick={copiarCodigo}
                    aria-label={`Copiar código da atividade: ${codigoAtividade}`}
                    className="alvo-toque inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-widest text-azul"
                  >
                    {codigoAtividade}
                    {codigoCopiado ? (
                      <Check size={16} className="text-verde-texto" aria-hidden="true" />
                    ) : (
                      <Copy size={16} className="text-coral-texto" aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  // Texto fixo em vez de tooltip: tooltip não aparece no toque
                  <span className="text-xs font-bold text-azul/80">Código gerado ao salvar</span>
                )}
                <span className="sr-only" aria-live="polite">
                  {codigoCopiado ? "Código copiado" : ""}
                </span>
              </div>
            </section>

            {/* 2. Identidade */}
            <section aria-label="Identificação" className="cartao p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-titulo" className="rotulo">
                  Título
                </label>
                <input
                  id="campo-titulo"
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Sons dos Animais"
                  className={`${CLASSE_CAMPO} border-cinza-claro/30`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <label htmlFor="campo-disciplina" className="rotulo">
                    Disciplina
                  </label>
                  <div className="relative">
                    {formData.disciplina.trim() && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-current ${corDaDisciplina.fg}`}
                      />
                    )}
                    <input
                      id="campo-disciplina"
                      type="text"
                      name="disciplina"
                      value={formData.disciplina}
                      onChange={handleChange}
                      // Ao sair do campo, "Matematica" vira "Matemática"
                      onBlur={() =>
                        setFormData((atual) => ({
                          ...atual,
                          disciplina: nomeDisciplina(atual.disciplina),
                        }))
                      }
                      placeholder="Ex: Ciências"
                      className={`${CLASSE_CAMPO} border-cinza-claro/30 ${
                        formData.disciplina.trim() ? "pl-7" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <SelectCustom
                    label="Turma"
                    name="turma_id"
                    value={formData.turma_id}
                    onChange={handleChange}
                    placeholder="Nenhuma"
                    options={turmas.map((turma) => ({
                      value: String(turma.id),
                      label: turma.nome,
                    }))}
                  />
                </div>
              </div>

              {erroTurmas && <Alerta>Não foi possível carregar as turmas: {erroTurmas}</Alerta>}
            </section>

            {/* 3. Configuração */}
            <section aria-label="Configuração" className="cartao p-4 flex flex-col gap-3">
              {/* Hoje só existe um tipo de jogo, então em vez de um select com
                  uma opção só fica o aviso de como ele funciona. O
                  tipo_atividade continua indo no corpo, como sempre. */}
              <div className="flex items-center gap-3 rounded-xl bg-bege px-3 py-2.5">
                <HandGrab size={20} className="text-coral-texto shrink-0" aria-hidden="true" />
                <p className="text-sm text-azul min-w-0">
                  <strong className="block">Arrastar e associar</strong>
                  <span className="text-azul/80">A criança arrasta a resposta até a pergunta</span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span id="rotulo-dificuldade" className="rotulo">
                  Dificuldade
                </span>
                <div role="group" aria-labelledby="rotulo-dificuldade" className="grid grid-cols-3 gap-2">
                  {Object.entries(DIFICULDADE_PROFESSOR).map(([valor, { rotulo }]) => {
                    const ativo = formData.dificuldade === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setFormData((atual) => ({ ...atual, dificuldade: valor }))}
                        className={`min-h-11 rounded-xl border text-sm font-bold transition-colors ${
                          ativo
                            ? "bg-coral border-coral text-azul-escuro"
                            : "bg-branco border-azul/20 text-azul hover:border-coral"
                        }`}
                      >
                        {rotulo}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarDetalhes((atual) => !atual)}
                aria-expanded={mostrarDetalhes}
                aria-controls="mais-opcoes"
                className="min-h-11 flex items-center justify-between gap-2 text-sm font-bold text-coral-texto"
              >
                Mais opções
                <span className="inline-flex items-center gap-1 text-xs text-azul/80">
                  Tempo, descrição
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform ${mostrarDetalhes ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {mostrarDetalhes && (
                <div id="mais-opcoes" className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="campo-tempo-seg" className="rotulo">
                      Tempo limite (seg)
                    </label>
                    <input
                      id="campo-tempo-seg"
                      type="number"
                      name="tempo_limite_seg"
                      value={formData.tempo_limite_seg}
                      onChange={handleChange}
                      placeholder="Sem limite"
                      min={0}
                      className={`${CLASSE_CAMPO} border-cinza-claro/30 ${SEM_SETINHAS}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="campo-descricao" className="rotulo">
                      Descrição
                    </label>
                    <textarea
                      id="campo-descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Uma breve descrição da atividade (opcional)"
                      rows={3}
                      className={`${CLASSE_CAMPO} border-cinza-claro/30 resize-none`}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* COLUNA DIREITA — questões da atividade, uma por bloco */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-azul">
                Questões{" "}
                <span className="text-base font-semibold text-azul/80">{questoes.length}</span>
              </h2>

              {/* Contorno (fundo branco) sobre o bege da página */}
              <Button
                type="button"
                variante="contorno"
                onClick={gerarQuestoesComIA}
                disabled={gerandoIA}
                className="px-4 py-2.5 text-sm font-bold gap-2 text-coral-texto!"
              >
                {gerandoIA ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-coral/40 border-t-coral rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} aria-hidden="true" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>

            {erroIA && (
              <Alerta className="flex items-center justify-between gap-3">
                <span>{erroIA}</span>
                <button
                  type="button"
                  onClick={() => setErroIA(null)}
                  aria-label="Fechar aviso"
                  className="btn btn-ghost btn-sm btn-square text-base"
                >
                  ×
                </button>
              </Alerta>
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
                  <QuestaoLinha
                    key={questao.localId}
                    questao={questao}
                    index={index}
                    erro={questoesInvalidas[questao.localId]}
                    tentativaInvalida={tentativaInvalida}
                    editando={questaoEditando === questao.localId}
                    podeRemover={questoes.length > 1}
                    onEditar={editarQuestao}
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
              onClick={aoAdicionarQuestao}
              className="w-full min-h-11 border-2 border-dashed border-azul/40 rounded-2xl py-3 flex items-center justify-center gap-2 text-azul font-bold text-sm hover:bg-branco/40 hover:border-coral transition-colors"
            >
              <Plus size={18} aria-hidden="true" />
              Adicionar questão
            </button>
          </div>
        </form>

        {/* Barra fixa embaixo: estado do salvamento + ações. O "Salvar" fica
            fora do <form>, ligado a ele pelo atributo form (Enter num campo
            continua salvando). */}
        <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 -mb-6 lg:-mb-8 px-4 sm:px-6 lg:px-8 py-3 bg-branco border-t border-cinza-claro flex flex-wrap items-center gap-x-4 gap-y-2">
          <p aria-live="polite" className="flex-1 min-w-40 flex items-center gap-2 text-sm font-bold text-azul">
            {houveAlteracao ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-coral shrink-0" aria-hidden="true" />
                {idAtividadeCriada ? "Alterações não salvas" : "Atividade ainda não salva"}
              </>
            ) : (
              <>
                <Check size={16} className="text-verde-texto shrink-0" aria-hidden="true" />
                Tudo salvo
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            {estadoOriginal ? (
              <Button
                variante="contorno"
                onClick={desfazerAlteracoes}
                disabled={salvando || !houveAlteracao}
                className="px-4 py-2.5 text-sm gap-2 border-coral! text-coral-texto!"
              >
                <Undo2 size={16} aria-hidden="true" />
                Desfazer
              </Button>
            ) : (
              // Atividade nova nunca salva: não há o que desfazer, então sai da tela
              <Button
                variante="contorno"
                onClick={() => navigate("/professor/atividades")}
                disabled={salvando}
                className="px-4 py-2.5 text-sm border-coral! text-coral-texto!"
              >
                Cancelar
              </Button>
            )}

            {/* A pré-visualização lê a atividade do servidor: com edição por
                salvar ela mostraria conteúdo velho, então só libera salvo */}
            {idAtividadeCriada &&
              (houveAlteracao ? (
                <Button
                  variante="secundario"
                  disabled
                  title="Salve para pré-visualizar"
                  className="px-4 py-2.5 text-sm gap-2"
                >
                  <Play size={16} aria-hidden="true" />
                  Pré-visualizar
                </Button>
              ) : (
                <Button
                  as={Link}
                  variante="secundario"
                  to="/jogo"
                  state={{ atividadeId: idAtividadeCriada }}
                  className="px-4 py-2.5 text-sm gap-2"
                >
                  <Play size={16} aria-hidden="true" />
                  Pré-visualizar
                </Button>
              ))}

            <Button
              type="submit"
              form="form-atividade"
              disabled={salvando || !houveAlteracao}
              className="px-5 py-2.5 text-sm"
            >
              {salvando ? "Salvando..." : "Salvar atividade"}
            </Button>
          </div>
        </div>
      </main>

      {/* Modal de sucesso ao criar/atualizar a atividade */}
      {mostrarSucesso && (
        <Modal aberto onFechar={() => setMostrarSucesso(false)} className="sm:p-8 flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-28 h-28 rounded-full bg-verde/10 flex items-center justify-center text-6xl">
              ✅
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              {foiCriacao
                ? "Atividade criada com sucesso!"
                : "Atividade atualizada com sucesso!"}
            </h3>
            <p className="text-sm text-azul/80">
              "{formData.titulo}" já está salva e pronta pra ser ajustada quando
              você quiser.
            </p>

            {codigoAtividade && (
              <div className="w-full flex flex-col gap-1.5 mt-1">
                <span className="rotulo">
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
                  <span className="text-xs font-bold text-coral-texto flex items-center gap-1">
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

            <Button onClick={() => setMostrarSucesso(false)} className="px-6 py-2.5 text-sm mt-2">
              Continuar editando
            </Button>
        </Modal>
      )}

      {/* Modal de erro — substitui o alert() nativo do navegador */}
      {mensagemErro && (
        <Modal aberto onFechar={() => setMensagemErro(null)} className="sm:p-8 flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-vermelho/10 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              Ops, algo deu errado
            </h3>
            <p className="text-sm text-azul/80">{mensagemErro}</p>
            <Button variante="contorno" onClick={() => setMensagemErro(null)} className="px-6 py-2.5 text-sm mt-2">
              Entendi
            </Button>
        </Modal>
      )}

      {/* Modal de escolha de imagem: buscar no Pixabay ou enviar do computador */}
      {modalImagemAberto && (
        <Modal aberto onFechar={fecharBuscaImagem} className="max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div role="tablist" className="tabs tabs-box bg-bege/60 rounded-2xl w-fit flex-nowrap p-0">
                <button
                  type="button"
                  role="tab"
                  onClick={() => setAbaImagem("buscar")}
                  className={`tab gap-2 rounded-2xl ${abaImagem === "buscar" ? "tab-active bg-coral text-azul-escuro font-bold" : ""}`}
                >
                  Buscar imagem
                </button>
                <button
                  type="button"
                  role="tab"
                  onClick={() => setAbaImagem("enviar")}
                  className={`tab gap-2 rounded-2xl ${abaImagem === "enviar" ? "tab-active bg-coral text-azul-escuro font-bold" : ""}`}
                >
                  Enviar arquivo
                </button>
              </div>
              <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={fecharBuscaImagem}>
                <X size={16} />
              </Button>
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder:text-azul/75 shadow-sm transition-all text-sm"
                  />
                  <button
                    type="submit"
                    disabled={buscandoImagens || !termoBuscaImagem.trim()}
                    className="shrink-0 rounded-xl px-4 py-2.5 font-bold text-sm text-azul-escuro bg-coral hover:bg-coral/90 disabled:opacity-50 disabled:cursor-not-allowed border-none transition-all inline-flex items-center justify-center"
                  >
                    {buscandoImagens ? (
                      <span className="w-3.5 h-3.5 border-2 border-branco/40 border-t-branco rounded-full animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                  </button>
                </form>

                {erroBuscaImagem && (
                  <Alerta className="flex items-center justify-between gap-3 mb-4">
                    <span>{erroBuscaImagem}</span>
                    <button
                      type="button"
                      onClick={() => setErroBuscaImagem(null)}
                      aria-label="Fechar aviso"
                      className="btn btn-ghost btn-sm btn-square text-base"
                    >
                      ×
                    </button>
                  </Alerta>
                )}

                <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                  {imagensPixabay.length === 0 && !buscandoImagens && !erroBuscaImagem && (
                    <p className="col-span-3 text-sm text-azul/80 text-center py-8">
                      Busque um termo pra ver as imagens.
                    </p>
                  )}
                  {imagensPixabay.map((imagem) => (
                    <button
                      key={imagem.id}
                      type="button"
                      onClick={() => selecionarImagemPixabay(imagem.url_imagem)}
                      disabled={enviandoImagem}
                      aria-label={`Selecionar imagem: ${imagem.tags}`}
                      className={`aspect-square rounded-xl overflow-hidden transition disabled:opacity-40 ${
                        urlPixabaySelecionada === imagem.url_imagem
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

                {/* A imagem escolhida é baixada e guardada no Cloudinary antes de
                    entrar na atividade — leva um instante, então avisa */}
                {enviandoImagem && (
                  <p className="text-sm text-azul/80 mt-3 text-center">
                    Salvando imagem escolhida...
                  </p>
                )}
                {erroUploadImagem && (
                  <Alerta className="flex items-center justify-between gap-3 mt-3">
                    <span>{erroUploadImagem}</span>
                  </Alerta>
                )}

                {totalPaginasImagens > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
                    <Button
                      variante="fantasma"
                      tamanho="sm"
                      onClick={() => irParaPaginaImagem(paginaAtual - 1)}
                      disabled={paginaAtual === 1 || buscandoImagens}
                    >
                      ‹
                    </Button>

                    {gerarPaginasVisiveis(paginaAtual, totalPaginasImagens).map(
                      (pagina, indice) =>
                        pagina === "..." ? (
                          <span
                            key={`reticencias-${indice}`}
                            className="px-1 text-azul/80 text-sm select-none"
                          >
                            …
                          </span>
                        ) : (
                          <Button
                            key={pagina}
                            variante={pagina === paginaAtual ? "primario" : "fantasma"}
                            tamanho="sm"
                            onClick={() => irParaPaginaImagem(pagina)}
                            disabled={buscandoImagens}
                          >
                            {pagina}
                          </Button>
                        )
                    )}

                    <Button
                      variante="fantasma"
                      tamanho="sm"
                      onClick={() => irParaPaginaImagem(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginasImagens || buscandoImagens}
                    >
                      ›
                    </Button>
                  </div>
                )}
              </>
            )}

            {abaImagem === "enviar" && (
              <div className="flex flex-col gap-4">
                {erroUploadImagem && (
                  <Alerta className="flex items-center justify-between gap-3">
                    <span>{erroUploadImagem}</span>
                    <button
                      type="button"
                      onClick={() => setErroUploadImagem(null)}
                      aria-label="Fechar aviso"
                      className="btn btn-ghost btn-sm btn-square text-base"
                    >
                      ×
                    </button>
                  </Alerta>
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
                      <span className="text-sm font-bold text-azul/80">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-6 h-6 text-coral-texto">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                        <path d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V11.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708z" />
                      </svg>
                      <span className="text-sm font-bold text-azul">Clique pra escolher um arquivo</span>
                      <span className="text-xs text-azul/80">JPEG, PNG, WEBP ou GIF, até 5MB</span>
                    </>
                  )}
                </label>
              </div>
            )}
        </Modal>
      )}

      {/* Exclusão da atividade. O texto diz o que o banco realmente faz com
          cada dependência, em vez de um aviso genérico de "essa ação é
          permanente" (mesmo padrão do modal de excluir turma) */}
      {modalExclusaoAberto && (
        <Modal aberto onFechar={excluindo ? undefined : fecharExclusao} className="max-w-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-vermelho/10 text-vermelho flex items-center justify-center">
              <Trash2 size={28} />
            </div>

            <h3 className="text-xl font-extrabold text-azul mt-3">
              Excluir a atividade?
            </h3>
            <p className="text-sm text-azul/80 mt-2">
              <strong className="text-azul">{formData.titulo}</strong> será
              removida e não tem como desfazer.
            </p>

            <div className="text-xs text-azul/80 leading-relaxed bg-bege/60 rounded-xl px-4 py-3 mt-4 text-left flex flex-col gap-1.5">
              <span>
                As <strong className="text-azul">{questoes.length} questão(ões)</strong> dessa
                atividade são apagadas junto.
              </span>
              <span>O histórico de partidas jogadas nela também é apagado.</span>
              <span>O XP que os alunos já ganharam com ela continua valendo.</span>
            </div>

            <div className="flex gap-3 w-full mt-5">
              <Button variante="contorno" onClick={fecharExclusao} disabled={excluindo} className="flex-1">
                Cancelar
              </Button>
              <Button variante="perigo" onClick={excluirAtividade} disabled={excluindo} className="flex-1">
                {excluindo ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
        </Modal>
      )}
    </>
  );
}

export default CriarAtividade;
