import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useJogo } from "../../controllers/useJogo";
import {BordaLateral} from "../../components/ui/BordaLateral";
import confetti from "canvas-confetti";
import { LogoKivira } from "../../components/LogoKivira";
import { calcularGradeMosaico, calcularFatiaMosaico } from "../../utils/mosaico";
import { apiRequest } from "../../services/api";

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
  const souAluno = localStorage.getItem("user_type") === "estudante";

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
        if (souAluno) {
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
  }, [atividadeId, souAluno]);

  const {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
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

  useEffect(() => {
    if (acertouTudo) {
      // Primeiro estouro bem no meio
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Um segundo estouro logo em seguida para dar mais volume (opcional)
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.7 },
        });
      }, 250);
    }
  }, [acertouTudo]);

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
        <Link to="/professor/atividades" className="text-coral font-bold text-sm hover:underline">
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
    <div className="min-h-screen bg-bege text-white flex flex-col">
      <header className="flex justify-between bg-branco items-center border-b border-white/10 py-2 px-3">
        <div className="flex items-center gap-4">
          <LogoKivira className="h-11 w-auto" />
          <Link
            to={souAluno ? "/aluno/home" : `/professor/atividades/${atividadeId}/editar`}
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            ← {souAluno ? "Voltar" : "Editar atividade"}
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
          <span className="font-bold text-start text-gray-500">
            {Object.keys(tabuleiro).length}/{perguntas.length}
            <div className="text-xs text-gray-400">peças colocadas</div>
          </span>
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

            <div
              key={fase}
              className={
                fase === "virado" ? "animate__animated animate__flipInY" : ""
              }
              style={{ animationDuration: "1s" }}
            >
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
                  let bordaCor = "border-white/10 bg-azul/15";
                  if (fase === "virado") {
                    bordaCor = correcao
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10";
                  } else if (pecaNoSlot) {
                    bordaCor = "border-coral/50 bg-laranja/10";
                  }
                  // Slot embaixo da peça que está sendo arrastada: mostra onde
                  // ela vai cair antes de o dedo soltar
                  if (slotAlvo === numeroSlot) {
                    bordaCor = "border-coral bg-coral/20";
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
                        <div className="w-full h-full relative flex items-center justify-center">
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
                            <div className="absolute rounded-xl inset-0 bg-red-500/10 pointer-events-none flex items-center justify-center">
                              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded-md font-bold shadow-sm">
                                ✗
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
                          className={`bg-laranja/20 transition-colors w-[99%] h-[98%] rounded-xl flex flex-col items-center justify-center p-1 relative ${
                            slotRecemSolto === numeroSlot ? "" : "group-hover:bg-laranja/40"
                          }`}
                        >
                          {/* A resposta some no hover pra o X ficar sozinho no
                              centro — os dois juntos no meio embolavam */}
                          <span
                            className={`text-white text-xl font-bold text-center line-clamp-1 transition-opacity ${
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
              <div className="w-full bg-branco/50 border border-white/10 rounded-xl p-2 grid grid-cols-4 gap-3">
                {pecasSoltas.length === 0 ? (
                  <span className="text-xs text-gray-500">
                    Todas as peças foram colocadas!
                  </span>
                ) : (
                  pecasSoltas.map((peca) => {
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
                        className={`w-full h-11 flex items-center justify-center rounded-xl border text-sm font-medium transition-all cursor-grab active:cursor-grabbing select-none ${
                          arrasto?.peca.id === peca.id
                            ? "opacity-0"
                            : estaSelecionada
                              ? "bg-coral border-coral text-white scale-102 shadow-md"
                              : "bg-laranja-claro/30 border-white/10 scale-102 hover:border-white/30 text-azul"
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
          <div className="flex justify-center mt-4">
            {acertouTudo ? (
              <div className="bg-green-500/20 text-green-400 font-bold px-6 py-2 rounded-full border border-green-500/30 animate__animated animate__pulse animate__infinite">
                Parabéns! Você acertou todas!
                {resultadoConclusao && ` (+${resultadoConclusao.xpGanho} XP)`}
              </div>
            ) : fase === "jogando" ? (
              <button
                disabled={!todosSlotsPreenchidos || processando || tempoEsgotado}
                onClick={virarTabuleiro}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  todosSlotsPreenchidos && !processando && !tempoEsgotado
                    ? "bg-coral text-white hover:opacity-90"
                    : "bg-azul/40 text-white cursor-not-allowed"
                }`}
              >
                {processando ? "Conferindo..." : "Virar o Tabuleiro"}
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={corrigirRespostas}
                  disabled={processando}
                  className="bg-azul text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↩ Corrigir respostas
                </button>

                <button
                  onClick={reiniciarJogo}
                  disabled={processando}
                  className="bg-coral text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-coral/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                    to={souAluno ? "/aluno/home" : `/professor/atividades/${atividadeId}/editar`}
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
    </div>
  );
}

export default JogoAndamento;
