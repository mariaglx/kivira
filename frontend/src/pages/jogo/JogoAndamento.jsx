import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useJogo } from "../../controllers/useJogo";
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

  useEffect(() => {
    if (!atividadeId) return;

    let cancelado = false;
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    Promise.all([
      apiRequest(`/atividade/${atividadeId}`, opcoesFetch),
      apiRequest(`/atividade/${atividadeId}/questoes`, opcoesFetch),
    ])
      .then(([dadosAtividade, dadosQuestoes]) => {
        if (cancelado) return;
        setAtividade(dadosAtividade);
        setPerguntasCarregadas(montarPerguntas(dadosQuestoes));
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
  }, [atividadeId]);

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
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
    reiniciarJogo,
  } = useJogo(perguntasCarregadas, atividade?.imagem_atividade_url || "/img/resultado.png");

  const acertouTudo =
    fase === "virado" &&
    Object.keys(resultados).length === perguntas.length &&
    Object.values(resultados).every((status) => status === true);
  const [resultadoFechado, setResultadoFechado] = useState(false);
  const [slotSobre, setSlotSobre] = useState(null); // slot sob a peça que está sendo arrastada

  // null enquanto não terminou; depois de virar tudo certo, guarda o XP ganho
  // (ou o erro) que voltou de POST /atividade/{id}/concluir — só aluno ganha
  // XP, professor/admin testando a atividade não gera nem chama o endpoint.
  const [progressoXp, setProgressoXp] = useState(null);
  // Garante 1 POST por vitória: acertouTudo fica "true" por vários renders
  // enquanto o modal está aberto, e um ref (ao contrário de estado) não
  // dispara o efeito de novo só por mudar de valor.
  const xpEnviadoRef = useRef(false);

  useEffect(() => {
    if (!acertouTudo) return;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: CORES_CONFETE });
    const t = setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.7 }, colors: CORES_CONFETE });
    }, 250);
    return () => clearTimeout(t);
  }, [acertouTudo]);

  useEffect(() => {
    if (!acertouTudo || !isAluno || xpEnviadoRef.current) return;
    xpEnviadoRef.current = true;

    let cancelado = false;
    apiRequest(`/atividade/${atividadeId}/concluir`, {
      method: "POST",
      data: { estrelas: estrelasPorTentativas(tentativas), tentativas },
    })
      .then((resultado) => {
        if (!cancelado) setProgressoXp(resultado);
      })
      .catch(() => {
        if (!cancelado) setProgressoXp({ erro: true });
      });

    return () => {
      cancelado = true;
    };
  }, [acertouTudo, isAluno, atividadeId, tentativas]);

  const jogarDeNovo = () => {
    setResultadoFechado(false);
    setProgressoXp(null);
    xpEnviadoRef.current = false;
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
      <header className="sticky top-0 z-30 bg-branco border-b-2 border-laranja/30 px-3 sm:px-4 py-2 flex items-center gap-3">
        <LogoKivira className="hidden sm:block h-10 w-auto shrink-0" />
        <Link
          to={isAluno ? rotaVoltar : `/professor/atividades/${atividadeId}/editar`}
          className="shrink-0 text-azul/50 hover:text-azul text-sm font-bold"
        >
          {isAluno ? "← Voltar" : "← Editar"}
        </Link>
        <span className="flex-1 min-w-0 truncate text-center font-bold text-azul">
          {atividade?.titulo}
        </span>
        <div className="w-24 sm:w-48 shrink-0">
          <BarraProgresso valor={colocadas} max={perguntas.length} segmentos />
          <div className="text-[11px] sm:text-xs text-azul/60 font-bold mt-1 text-right sm:text-left">
            {colocadas}/{perguntas.length}
            <span className="hidden sm:inline"> peças colocadas</span>
          </div>
        </div>
      </header>

      {/* Celular/tablet: perguntas → tabuleiro → peças empilhados; desktop
          (lg+): perguntas numa coluna fixa à esquerda, como antes */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-3 sm:p-4 lg:p-6">
        <aside className="lg:w-80 xl:w-96 shrink-0 bg-branco rounded-3xl p-3 sm:p-4 shadow-sm lg:self-start lg:sticky lg:top-20">
          <h2 className="faixa-secao mb-3">Perguntas</h2>
          {/* altura limitada fora do desktop pra o tabuleiro não sumir da tela */}
          <ol className="flex flex-col gap-2 max-h-48 sm:max-h-64 overflow-y-auto lg:max-h-[calc(100vh-10rem)]">
            {perguntas.map((q) => (
              <li
                key={q.id}
                className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 text-sm sm:text-base ${
                  tabuleiro[q.id] ? "bg-azul/5 text-azul/60" : "bg-bege/60 text-azul"
                }`}
              >
                <span className="w-7 h-7 shrink-0 rounded-full bg-coral text-branco text-sm font-black flex items-center justify-center">
                  {q.id}
                </span>
                <span className="font-semibold pt-0.5">{q.texto_questao}</span>
              </li>
            ))}
          </ol>
        </aside>

        {/* Área Principal do Jogo */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tabuleiro */}
          <section className="w-full">
            <h2 className="faixa-secao mb-2">Tabuleiro</h2>

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
                  fase === "virado" ? "gap-0.5" : "gap-1.5 sm:gap-3"
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
                  if (slotSobre === numeroSlot) bordaCor += " ring-4 ring-coral/40 scale-[1.03]";

                  return (
                    <button
                      key={numeroSlot}
                      disabled={fase === "virado"}
                      onClick={() => encaixarNoTabuleiro(numeroSlot)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={() => setSlotSobre(numeroSlot)}
                      onDragLeave={() => setSlotSobre(null)}
                      onDrop={() => {
                        setSlotSobre(null);
                        dropNoTabuleiro(numeroSlot);
                      }}
                      className={`w-full aspect-4/3 sm:aspect-video lg:aspect-21/9 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-all ${bordaCor}`}
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

                      {/* Se estiver jogando e tiver peça */}
                      {fase === "jogando" && pecaNoSlot && (
                        <div className="w-[99%] h-[98%] rounded-xl flex flex-col items-center justify-center p-1 relative animate__animated animate__bounceIn" style={{ animationDuration: "0.4s" }}>
                          <span className="text-azul text-xs sm:text-base lg:text-xl leading-tight font-bold text-center line-clamp-2 sm:line-clamp-1 break-words">
                            {pecaNoSlot.resposta_certa}
                          </span>
                        </div>
                      )}

                      {/* Slot Vazio */}
                      {fase === "jogando" && !pecaNoSlot && (
                        <span className="text-azul/80 text-lg sm:text-2xl font-bold">
                          {numeroSlot}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Peças Soltas — no celular/tablet a bandeja gruda no rodapé, pra
              dar pra escolher a peça e encaixar sem rolar a tela pra cima e
              pra baixo a cada jogada */}
          {fase === "jogando" && (
            <section className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 pt-2 pb-3 bg-bege/95 backdrop-blur-sm lg:static lg:p-0 lg:bg-transparent lg:backdrop-blur-none">
              <h2 className="faixa-secao mb-2">Peças soltas</h2>
              <div className="w-full bg-branco border-2 border-azul/10 rounded-2xl p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 max-h-40 sm:max-h-52 overflow-y-auto lg:max-h-none">
                {pecasSoltas.length === 0 ? (
                  <span className="col-span-full text-sm font-semibold text-azul/60 text-center py-2">
                    Todas as peças foram colocadas!
                  </span>
                ) : (
                  pecasSoltas.map((peca, indice) => {
                    const estaSelecionada = pecaSelecionada?.id === peca.id;
                    return (
                      <button
                        key={peca.id}
                        onClick={() => selecionarPeca(peca)}
                        draggable
                        onDragStart={() => iniciarDrag(peca)}
                        /* w-full garante a mesma largura do tabuleiro, h-11 deixa a peça baixinha e achatada */
                        className={`tatil w-full min-h-11 px-2 py-1.5 flex items-center justify-center text-center leading-tight rounded-xl text-sm font-bold cursor-grab active:cursor-grabbing ${
                          estaSelecionada
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
            </section>
          )}

          {/* Barra de Ações (Botões de Virar / Corrigir) */}
          <div className="flex justify-center my-2 lg:my-4">
            {acertouTudo ? (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => setResultadoFechado(false)}
                  className="tatil bg-azul text-white px-6 py-3 rounded-full font-bold text-sm [--sombra:var(--color-azul-escuro)]"
                >
                  ⭐ Ver resultado
                </button>
                <button
                  onClick={jogarDeNovo}
                  className="tatil bg-coral text-white px-6 py-3 rounded-full font-bold text-sm"
                >
                  Jogar de novo
                </button>
              </div>
            ) : fase === "jogando" ? (
              <button
                disabled={!todosSlotsPreenchidos}
                onClick={virarTabuleiro}
                className={`tatil px-6 py-3 rounded-full font-bold text-sm disabled:cursor-not-allowed ${
                  todosSlotsPreenchidos
                    ? "bg-coral text-white animate__animated animate__pulse animate__infinite"
                    : "bg-azul/30 text-white"
                }`}
              >
                Virar o Tabuleiro
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <button
                  onClick={corrigirRespostas}
                  className="tatil bg-azul text-white px-6 py-3 rounded-full font-bold text-sm [--sombra:var(--color-azul-escuro)]"
                >
                  ↩ Corrigir respostas
                </button>

                <button
                  onClick={jogarDeNovo}
                  className="tatil bg-coral text-white px-6 py-3 rounded-full font-bold text-sm"
                >
                  🗑️ Começar do zero
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {mostrarResultado && (
        <div className="fixed inset-0 z-50 bg-azul/60 flex items-center justify-center p-4">
          <div className="bg-branco rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl animate__animated animate__zoomIn">
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
            <p className="text-azul/70 font-semibold mb-4">
              Você acertou todas as {perguntas.length} peças
              {tentativas > 1 ? ` (na tentativa ${tentativas})` : " de primeira"}!
            </p>

            {isAluno && progressoXp && !progressoXp.erro && (
              <div className="mb-6">
                <span className="tatil inline-block bg-verde/15 text-verde font-black text-lg px-4 py-2 rounded-2xl animate__animated animate__bounceIn">
                  +{progressoXp.xp_ganho} XP
                </span>
                {progressoXp.subiu_nivel && (
                  <p className="mt-2 text-coral font-black animate__animated animate__tada">
                    🎉 Subiu para o nível {progressoXp.nivel_atual}!
                  </p>
                )}
              </div>
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
