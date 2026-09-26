import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useJogo } from "../../controllers/useJogo";
import {BordaLateral} from "../../components/ui/BordaLateral";
import confetti from "canvas-confetti";
import { LogoKivira } from "../../components/LogoKivira";
import { calcularGradeMosaico, calcularFatiaMosaico } from "../../utils/mosaico";
import { apiRequest } from "../../services/api";
import { BarraProgresso } from "../../components/ui/BarraProgresso";

const CORES_CONFETE = ["#eb7561", "#eeb37f", "#214a5a", "#3fae7a"];
const ATRASO_VIRADA_MS = 90; // intervalo entre uma peça e outra na revelação do mosaico

// 3 estrelas se acertou tudo de primeira, 2 com uma correção, 1 nos demais casos
const estrelasPorTentativas = (tentativas) => Math.max(1, 4 - tentativas);

function mensagemProgresso(colocadas, total) {
  if (colocadas === 0) return "Escolha uma peça e encaixe no tabuleiro!";
  if (colocadas === total) return "Tudo no lugar! Agora é só virar o tabuleiro 🎉";
  if (colocadas === total - 1) return "Só mais uma peça!";
  if (colocadas >= Math.ceil(total / 2)) return "Metade do caminho! 🎉";
  return "Muito bem, continue encaixando!";
}

// Monta as perguntas no formato que useJogo espera a partir da resposta de
// GET /atividade/{id}/questoes — `id` vira a ORDEM (não o id do banco), porque
// é a ordem que casa a peça certa com o slot certo no tabuleiro estilo LUK
function montarPerguntas(dadosQuestoes) {
  return dadosQuestoes.questoes.map((q) => {
    const opcaoCorreta = q.opcoes.find((o) => o.correta) || q.opcoes[0];
    return {
      id: q.ordem,
      texto_questao: q.texto_questao,
      resposta_certa: opcaoCorreta?.texto_opcao || "",
    };
  });
}

function formatarRelogio(totalSegundos) {
  const seguro = Math.max(0, totalSegundos);
  const minutos = Math.floor(seguro / 60);
  const segundos = seguro % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

export function JogoAndamento() {
  const { state } = useLocation();
  const atividadeId = state?.atividadeId;
  // Aluno joga a atividade; professor/admin abrem pra testar e podem voltar pra edição
  const isAluno = localStorage.getItem("user_type") === "estudante";
  const rotaVoltar = isAluno ? "/aluno/home" : "/professor/atividades";

  const [atividade, setAtividade] = useState(null);
  const [perguntasCarregadas, setPerguntasCarregadas] = useState([]);
  const [carregando, setCarregando] = useState(!!atividadeId);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [sessaoId, setSessaoId] = useState(null);

  // Cronômetro: com tempo_limite_seg conta pra baixo, sem ele conta pra cima.
  // O ponto de partida vem do servidor (calculado do iniciado_em), não do
  // relógio da máquina, que pode estar errado ou adiantado de propósito.
  const [tempoLimite, setTempoLimite] = useState(null);
  const [restantes, setRestantes] = useState(null);
  const [decorridos, setDecorridos] = useState(0);
  const jaAvisouTempo = useRef(false);
  // Diferencia "soltei a peça" de "cliquei na peça": sem isso, o clique que o
  // navegador dispara no fim do arrasto selecionaria a peça sem querer
  const arrastando = useRef(false);

  // Arrasto: a peça sai do layout e vira um elemento fixo grudado no cursor.
  // Guarda o deslocamento de onde ela foi pega (offsetX/offsetY) pra ela não
  // "pular" pro centro do mouse — é o que dava a sensação de impreciso.
  const [arrasto, setArrasto] = useState(null);
  const [slotAlvo, setSlotAlvo] = useState(null);
  // Slot que acabou de receber peça. Ao soltar, o cursor já está em cima dele e
  // o hover dispararia na hora, escondendo com o X a resposta que a criança
  // acabou de encaixar. Fica suprimido até o mouse sair e voltar.
  const [slotRecemSolto, setSlotRecemSolto] = useState(null);

  useEffect(() => {
    if (!atividadeId) return;

    let cancelado = false;
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    Promise.all([
      apiRequest(`/atividade/${atividadeId}`, opcoesFetch),
      apiRequest(`/atividade/${atividadeId}/questoes`, opcoesFetch),
    ])
      .then(async ([dadosAtividade, dadosQuestoes]) => {
        if (cancelado) return;
        setAtividade(dadosAtividade);
        setPerguntasCarregadas(montarPerguntas(dadosQuestoes));

        // Só o aluno grava partida; a pré-visualização do professor não abre sessão
        if (isAluno) {
          const sessao = await apiRequest("/sessao_jogo/iniciar", {
            method: "POST",
            data: { atividade_id: Number(atividadeId) },
          });
          if (cancelado) return;
          setSessaoId(sessao.sessao_id);
          // Quanto falta vem do servidor (contado do iniciado_em), não do
          // relógio da máquina — que pode estar errado ou adiantado de propósito
          setTempoLimite(sessao.tempo_limite_seg ?? null);
          setRestantes(sessao.segundos_restantes ?? null);
        } else {
          // Pré-visualização do professor: não grava partida, mas o tempo que
          // ele configurou vale igual — senão ele define um limite e não tem
          // como ver o efeito do que definiu. Aqui a contagem parte do total,
          // porque não existe sessão pra contar a partir dela.
          setTempoLimite(dadosAtividade.tempo_limite_seg ?? null);
          setRestantes(dadosAtividade.tempo_limite_seg ?? null);
        }
      })
      .catch((erro) => {
        if (!cancelado && erro.name !== "AbortError") {
          setErroCarregamento(erro.message || "Não foi possível carregar a atividade");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [atividadeId, isAluno]);

  const {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
    tentativas,
    todosSlotsPreenchidos,
    imagemAtividadeUrl,
    processando,
    erroPartida,
    resultadoConclusao,
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
    reiniciarJogo,
  } = useJogo(perguntasCarregadas, atividade?.imagem_atividade_url || "/img/resultado.png", sessaoId);

  const acertouTudo =
    fase === "virado" &&
    Object.keys(resultados).length === perguntas.length &&
    Object.values(resultados).every((status) => status === true);

  // Derivado em vez de guardado em estado: evita setState dentro de efeito
  const tempoEsgotado = Boolean(tempoLimite) && restantes !== null && restantes <= 0;
  const partidaEncerrada = acertouTudo || tempoEsgotado;

  // Tique do relógio, parado quando a partida acaba
  useEffect(() => {
    if (carregando || partidaEncerrada) return;

    const id = setInterval(() => {
      if (tempoLimite) {
        setRestantes((atual) => (atual === null ? null : Math.max(0, atual - 1)));
      } else {
        setDecorridos((atual) => atual + 1);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [carregando, partidaEncerrada, tempoLimite]);

  // Zerou: avisa o servidor, que reconfere pelo iniciado_em antes de encerrar.
  // Sem sessão (preview do professor), a trava fica só na tela.
  useEffect(() => {
    if (!tempoEsgotado || !sessaoId || jaAvisouTempo.current) return;

    jaAvisouTempo.current = true;
    apiRequest(`/sessao_jogo/${sessaoId}/tempo_esgotado`, { method: "POST" }).catch(() => {
      // A trava na tela vale mesmo se o aviso falhar — a sessão vira abandonada
      // assim que o aluno iniciar essa atividade de novo
    });
  }, [tempoEsgotado, sessaoId]);

  // Enquanto arrasta: a peça acompanha o ponteiro 1:1 e o slot embaixo dele
  // fica destacado. Os ouvintes ficam no window pra o arrasto não se perder
  // se o cursor sair de cima da peça num movimento rápido.
  const arrastoAtivo = arrasto !== null;
  useEffect(() => {
    if (!arrastoAtivo) return;

    const slotSob = (evento) =>
      document.elementFromPoint(evento.clientX, evento.clientY)?.closest("[data-slot]");

    const mover = (evento) => {
      setArrasto((atual) => (atual ? { ...atual, x: evento.clientX, y: evento.clientY } : atual));
      const alvo = slotSob(evento);
      setSlotAlvo(alvo ? Number(alvo.dataset.slot) : null);
    };

    const soltar = (evento) => {
      const alvo = slotSob(evento);
      if (alvo) {
        dropNoTabuleiro(Number(alvo.dataset.slot));
        setSlotRecemSolto(Number(alvo.dataset.slot));
      }
      setArrasto(null);
      setSlotAlvo(null);
      // O clique que o navegador dispara no fim do arrasto não pode
      // selecionar a peça de novo
      setTimeout(() => {
        arrastando.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, [arrastoAtivo, dropNoTabuleiro]);

  const [resultadoFechado, setResultadoFechado] = useState(false);

  useEffect(() => {
    if (!acertouTudo) return;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: CORES_CONFETE });
    const t = setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.7 }, colors: CORES_CONFETE });
    }, 250);
    return () => clearTimeout(t);
  }, [acertouTudo]);

  const jogarDeNovo = () => {
    setResultadoFechado(false);
    reiniciarJogo();
  };

  const colocadas = Object.keys(tabuleiro).length;
  const acertos = Object.values(resultados).filter(Boolean).length;
  const mostrarResultado = acertouTudo && !resultadoFechado;

  // Gerar array de slots com base no número de perguntas
  const slotsTabuleiro = perguntas.map((p) => p.id);

  // Grade do mosaico calculada a partir da quantidade real de blocos da atividade
  // (6, 9, 12, 24 têm proporções fixas; qualquer outro N cai num fallback quase-quadrado)
  const gradeMosaico = calcularGradeMosaico(perguntas.length);

  if (!atividadeId || erroCarregamento) {
    return (
      <div className="min-h-screen bg-bege flex flex-col items-center justify-center gap-3">
        <p className="text-azul font-bold">
          {erroCarregamento || "Nenhuma atividade selecionada."}
        </p>
        <Link to={rotaVoltar} className="text-coral font-bold text-sm hover:underline">
          ← Voltar pras atividades
        </Link>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-bege flex items-center justify-center">
        <p className="text-azul/60 font-medium">Carregando atividade...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bege text-azul flex flex-col">
      <header className="flex justify-between bg-branco items-center border-b border-azul/10 py-2 px-3">
        <div className="flex items-center gap-4">
          <LogoKivira className="h-11 w-auto" />
          <Link
            to={isAluno ? rotaVoltar : `/professor/atividades/${atividadeId}/editar`}
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            {isAluno ? "← Voltar" : "← Editar atividade"}
          </Link>
        </div>
        <span className="text-md font-bold text-azul">{atividade?.titulo}</span>
        <div className="flex items-center gap-6">
          {/* Cronômetro: pra baixo quando a atividade tem tempo_limite_seg,
              pra cima quando não tem. Fica coral nos últimos 30 segundos. */}
          <span
            className={`font-bold text-start tabular-nums ${
              tempoEsgotado || (tempoLimite && restantes !== null && restantes <= 30)
                ? "text-coral"
                : "text-gray-500"
            }`}
          >
            {formatarRelogio(tempoLimite ? (restantes ?? 0) : decorridos)}
            <div className="text-xs text-gray-400">
              {tempoLimite ? "tempo restante" : "tempo de jogo"}
            </div>
          </span>
          <div className="w-48">
            <BarraProgresso valor={colocadas} max={perguntas.length} segmentos />
            <div className="text-xs text-azul/60 font-bold mt-1">
              {colocadas}/{perguntas.length} peças colocadas
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Barra Lateral de Perguntas */}
        <BordaLateral>
          <h2 className="text-xs uppercase text-gray-500 tracking-widest my-3">
            Perguntas
          </h2>
          <ul className="flex flex-col bg-azul/5 rounded-box gap-2 p-2">
            {perguntas.map((q) => {
              // Verde assim que a peça é encaixada — a criança vê o que já
              // respondeu sem precisar conferir peça por peça no tabuleiro.
              // Tom vindo da paleta (o verde de Ciências), não uma cor nova.
              const respondida = tabuleiro[q.id] !== undefined;
              return (
                <li key={q.id}>
                  <div
                    className={`flex items-center gap-4 text-md text-azul py-2.5 px-3 rounded-lg transition-colors ${
                      respondida
                        ? "bg-cie-bg hover:bg-cie-bg"
                        : "bg-azul/10 hover:bg-azul/20"
                    }`}
                  >
                    <span className={`font-bold ${respondida ? "text-cie-fg-escuro" : "text-coral"}`}>
                      {q.id}.
                    </span>
                    <span className="font-medium text-left">
                      {q.texto_questao}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </BordaLateral>

        {/* Área Principal do Jogo */}
        <main className="flex-1 flex bg-bege flex-col mx-4">
          {/* Tabuleiro */}
          <div className="w-full">
            <h2 className="text-xs uppercase text-gray-500 tracking-widest my-3">
              Tabuleiro
            </h2>

            {fase === "jogando" && (
              <p className="text-sm font-bold text-coral mb-2">
                {mensagemProgresso(colocadas, perguntas.length)}
              </p>
            )}
            {fase === "virado" && !acertouTudo && (
              <p className="text-sm font-bold text-coral mb-2">
                Quase lá! Você acertou {acertos} de {perguntas.length}. Corrija as peças com a moldura coral.
              </p>
            )}

            <div>
              <div
                className={`grid w-full transition-all duration-300 ${
                  fase === "virado" ? "gap-0.5" : "gap-3"
                }`}
                style={{
                  gridTemplateColumns: `repeat(${gradeMosaico.colunas}, minmax(0, 1fr))`,
                }}
              >
                {slotsTabuleiro.map((numeroSlot) => {
                  const pecaNoSlot = tabuleiro[numeroSlot];
                  const correcao = resultados[numeroSlot]; // true | false | undefined

                  // A fatia do mosaico que aparece no slot é sempre a da RESPOSTA nele
                  // encaixada (ou a do próprio slot, se vazio) — cada resposta "dona" de uma fatia fixa
                  const idPecaImagem = pecaNoSlot ? pecaNoSlot.id : numeroSlot;
                  const fatia = calcularFatiaMosaico(idPecaImagem, gradeMosaico);

                  // Estilização dinâmica com Tailwind baseada no estado
                  let bordaCor = "border-azul/25 bg-azul/10";
                  if (fase === "virado") {
                    bordaCor = correcao
                      ? "border-verde bg-verde/10"
                      : "border-coral bg-coral/10 animate-tremida-leve";
                  } else if (pecaNoSlot) {
                    bordaCor = "border-coral/60 bg-laranja/30";
                  } else if (pecaSelecionada) {
                    bordaCor = "border-coral/60 bg-azul/10 animate-pulse";
                  }
                  // Slot embaixo da peça que está sendo arrastada: mostra onde
                  // ela vai cair antes de o dedo soltar. Usa `slotAlvo`, do
                  // arrasto por pointer events — os eventos HTML5 de drag não
                  // disparam aqui porque as peças não são mais `draggable`.
                  if (slotAlvo === numeroSlot) {
                    bordaCor += " ring-4 ring-coral/40 scale-[1.03]";
                  }

                  return (
                    <button
                      key={numeroSlot}
                      // data-slot é como o arrasto descobre em qual slot a peça
                      // foi solta (elementFromPoint na hora de largar)
                      data-slot={numeroSlot}
                      disabled={fase === "virado"}
                      onClick={() => {
                        // Colocar por clique tem o mesmo problema do arrasto:
                        // o cursor fica sobre o slot logo depois de encaixar
                        if (pecaSelecionada) setSlotRecemSolto(numeroSlot);
                        encaixarNoTabuleiro(numeroSlot);
                      }}
                      onPointerLeave={() => {
                        if (slotRecemSolto === numeroSlot) setSlotRecemSolto(null);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dropNoTabuleiro(numeroSlot)}
                      className={`group w-full aspect-21/9 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-all ${bordaCor}`}
                    >
                      {/* MODO VIRADO: MOSTRA O VERSO/IMAGEM (ESTILO LUK) */}
                      {fase === "virado" && (
                        <div
                          className={`w-full h-full relative flex items-center justify-center animate__animated animate__flipInY ${
                            correcao ? "animate__pulse" : ""
                          }`}
                          style={{
                            animationDelay: `${(numeroSlot - 1) * ATRASO_VIRADA_MS}ms`,
                            animationDuration: "0.7s",
                          }}
                        >
                          <div
                            className="absolute inset-0 bg-no-repeat transition-all duration-500"
                            style={{
                              backgroundImage: `url(${imagemAtividadeUrl})`,
                              width: "100%",
                              height: "100%",
                              borderRadius: "0.5rem", // Para manter o mesmo arredondamento do botão
                              ...fatia,
                            }}
                          />
                          {!correcao && (
                            <div className="absolute rounded-xl inset-0 bg-coral/20 pointer-events-none">
                              <span className="absolute top-1 right-1 bg-coral text-white text-xs px-1.5 rounded-md font-bold shadow-sm">
                                ↻
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Se estiver jogando e tiver peça. O hover escurece e
                          mostra o X: clicar no slot já devolvia a peça pra mesa,
                          mas nada dizia isso — o X é o aviso dessa ação. */}
                      {fase === "jogando" && pecaNoSlot && (
                        <div
                          className="w-[99%] h-[98%] rounded-xl flex flex-col items-center justify-center p-1 relative animate__animated animate__bounceIn"
                          style={{ animationDuration: "0.4s" }}
                        >
                          {/* A resposta some no hover pra o X ficar sozinho no
                              centro — os dois juntos no meio embolavam */}
                          <span
                            className={`text-azul text-xl font-bold text-center line-clamp-1 transition-opacity ${
                              slotRecemSolto === numeroSlot ? "" : "group-hover:opacity-0"
                            }`}
                          >
                            {pecaNoSlot.resposta_certa}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity ${
                              slotRecemSolto === numeroSlot ? "" : "group-hover:opacity-100"
                            }`}
                          >
                            {/* Cinza e sem sombra: é uma ação secundária, não
                                precisa competir com o coral dos botões de ação */}
                            <span className="w-8 h-8 rounded-full bg-cinza-claro/80 text-azul/45 text-lg flex items-center justify-center">
                              ×
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Slot Vazio */}
                      {fase === "jogando" && !pecaNoSlot && (
                        <span className="text-azul/80 text-2xl font-bold">
                          {numeroSlot}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Peças Soltas */}
          {fase === "jogando" && (
            <div className="w-full">
              <h2 className="text-xs uppercase text-gray-500 tracking-widest my-3">
                Peças Soltas
              </h2>
              <div className="w-full bg-branco/60 border-2 border-azul/10 rounded-xl p-3 grid grid-cols-4 gap-3">
                {pecasSoltas.length === 0 ? (
                  <span className="text-xs text-gray-500">
                    Todas as peças foram colocadas!
                  </span>
                ) : (
                  pecasSoltas.map((peca, indice) => {
                    const estaSelecionada = pecaSelecionada?.id === peca.id;
                    return (
                      <button
                        key={peca.id}
                        onPointerDown={(evento) => {
                          // Guarda onde dentro da peça o dedo/cursor pegou, pra
                          // ela seguir o ponteiro sem pular pro centro
                          const caixa = evento.currentTarget.getBoundingClientRect();
                          arrastando.current = true;
                          iniciarDrag(peca);
                          setArrasto({
                            peca,
                            largura: caixa.width,
                            altura: caixa.height,
                            deslocX: evento.clientX - caixa.left,
                            deslocY: evento.clientY - caixa.top,
                            x: evento.clientX,
                            y: evento.clientY,
                          });
                        }}
                        onClick={() => {
                          if (!arrastando.current) selecionarPeca(peca);
                        }}
                        style={{ touchAction: "none" }}
                        /* w-full garante a mesma largura do tabuleiro, h-11 deixa a peça baixinha e achatada */
                        className={`tatil w-full h-11 flex items-center justify-center rounded-xl text-sm font-bold cursor-grab active:cursor-grabbing select-none ${
                          // Enquanto arrasta, a peça original some: quem segue o
                          // ponteiro é a cópia flutuante lá embaixo
                          arrasto?.peca.id === peca.id
                            ? "opacity-0"
                            : estaSelecionada
                              ? "bg-coral text-white -translate-y-1 scale-105 [--sombra:var(--color-coral-escuro)]"
                              : `bg-laranja-claro text-azul [--sombra:var(--color-laranja-escuro)] ${
                                  indice % 2 ? "rotate-1" : "-rotate-1"
                                }`
                        }`}
                      >
                        {peca.resposta_certa}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Aviso de erro da partida (falha ao conferir/reiniciar no servidor) */}
          {erroPartida && (
            <p className="text-center text-red-500 text-sm font-medium mt-2">{erroPartida}</p>
          )}

          {/* Barra de Ações (Botões de Virar / Corrigir) */}
          <div className="flex justify-center mt-6 mb-6">
            {acertouTudo ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setResultadoFechado(false)}
                  className="tatil bg-azul text-white px-6 py-3 rounded-full font-bold text-sm [--sombra:var(--color-azul-escuro)]"
                >
                  ⭐ Ver resultado
                </button>
                <button
                  onClick={jogarDeNovo}
                  disabled={processando}
                  className="tatil bg-coral text-white px-6 py-3 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Jogar de novo
                </button>
              </div>
            ) : fase === "jogando" ? (
              <button
                disabled={!todosSlotsPreenchidos || processando || tempoEsgotado}
                onClick={virarTabuleiro}
                className={`tatil px-6 py-3 rounded-full font-bold text-sm disabled:cursor-not-allowed ${
                  todosSlotsPreenchidos && !processando && !tempoEsgotado
                    ? "bg-coral text-white animate__animated animate__pulse animate__infinite"
                    : "bg-azul/30 text-white"
                }`}
              >
                {processando ? "Conferindo..." : "Virar o Tabuleiro"}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={corrigirRespostas}
                  disabled={processando}
                  className="tatil bg-azul text-white px-6 py-3 rounded-full font-bold text-sm [--sombra:var(--color-azul-escuro)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↩ Corrigir respostas
                </button>

                <button
                  onClick={jogarDeNovo}
                  disabled={processando}
                  className="tatil bg-coral text-white px-6 py-3 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🗑️ Começar do zero
                </button>
              </div>
            )}
          </div>

          {/* A peça "na mão": fora do layout, grudada no ponteiro, sem capturar
              evento nenhum (senão o elementFromPoint acharia ela mesma embaixo
              do cursor em vez do slot) */}
          {arrasto && (
            <div
              className="fixed z-50 pointer-events-none flex items-center justify-center rounded-xl border bg-coral border-coral text-white text-sm font-medium shadow-lg"
              style={{
                left: arrasto.x - arrasto.deslocX,
                top: arrasto.y - arrasto.deslocY,
                width: arrasto.largura,
                height: arrasto.altura,
              }}
            >
              {arrasto.peca.resposta_certa}
            </div>
          )}

          {/* Tempo esgotado: trava o tabuleiro e oferece recomeçar */}
          {tempoEsgotado && (
            <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
              <div className="bg-branco rounded-3xl shadow-xl max-w-sm w-full p-8 text-center">
                <h2 className="text-xl font-extrabold text-azul">O tempo acabou!</h2>
                <p className="text-sm text-azul/60 mt-2">
                  Não tem problema. Você pode começar de novo quando quiser.
                </p>
                <p className="text-sm font-bold text-azul bg-bege rounded-xl px-4 py-2.5 mt-4 inline-block">
                  Você encaixou {Object.keys(tabuleiro).length} de {perguntas.length}
                </p>
                <div className="flex gap-3 justify-center mt-5">
                  <Link
                    to={isAluno ? "/aluno/home" : `/professor/atividades/${atividadeId}/editar`}
                    className="bg-azul/5 hover:bg-azul/10 text-azul px-6 py-2.5 rounded-full font-bold text-sm transition-all"
                  >
                    Voltar
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-coral text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-coral/90 transition-all shadow-md"
                  >
                    Tentar de novo
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {mostrarResultado && (
        <div className="fixed inset-0 z-50 bg-azul/60 flex items-center justify-center p-4">
          <div className="bg-branco rounded-3xl p-8 max-w-sm w-full text-center shadow-xl animate__animated animate__zoomIn">
            <h2 className="text-3xl font-black text-azul">Parabéns! 🎉</h2>
            <div className="flex justify-center gap-2 my-5 text-5xl">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`animate__animated animate__bounceIn ${
                    n <= estrelasPorTentativas(tentativas) ? "" : "grayscale opacity-30"
                  }`}
                  style={{ animationDelay: `${300 + n * 250}ms` }}
                >
                  ⭐
                </span>
              ))}
            </div>
            <p className={`text-azul/70 font-semibold ${resultadoConclusao ? "mb-2" : "mb-6"}`}>
              Você acertou todas as {perguntas.length} peças
              {tentativas > 1 ? ` (na tentativa ${tentativas})` : " de primeira"}!
            </p>

            {/* XP só aparece pro aluno: a pré-visualização do professor não abre
                sessão, então não há pontuação pra mostrar */}
            {resultadoConclusao && (
              <p className="text-ouro-fg-escuro font-black text-xl mb-6">
                +{resultadoConclusao.xpGanho} XP
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={jogarDeNovo}
                className="tatil bg-coral text-white py-3 rounded-2xl font-bold"
              >
                Jogar de novo
              </button>
              <button
                onClick={() => setResultadoFechado(true)}
                className="tatil bg-azul text-white py-3 rounded-2xl font-bold [--sombra:var(--color-azul-escuro)]"
              >
                Ver o mosaico
              </button>
              <Link to={rotaVoltar} className="text-azul/60 hover:text-azul text-sm font-bold">
                {isAluno ? "← Voltar pras atividades" : "← Voltar"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JogoAndamento;
