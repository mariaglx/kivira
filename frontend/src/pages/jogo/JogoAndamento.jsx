import React from "react";
import { useJogo } from "../../controllers/useJogo";
import BordaLateral from "../../components/ui/BordaLateral";
import confetti from "canvas-confetti";
import { useEffect } from "react"; 
import { LogoKivira } from "../../components/LogoKivira";

export function JogoAndamento() {
  const {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
    todosSlotsPreenchidos,
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
    reiniciarJogo,
  } = useJogo();

  const acertouTudo =
    fase === "virado" &&
    Object.keys(resultados).length === perguntas.length &&
    Object.values(resultados).every((status) => status === true);
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

  const URL_IMAGEM = "/img/resultado.png";

  return (
    <div className="min-h-screen bg-bege text-white flex flex-col">
      <header className="flex justify-between bg-branco items-center border-b border-white/10 py-2 px-3">
        <LogoKivira className="h-11 w-auto" />
        <span className="text-md font-bold text-azul">Sons dos Animais</span>
        <span className="font-bold text-start text-gray-500">
          {Object.keys(tabuleiro).length}/12
          <div className="text-xs text-gray-400">peças colocadas</div>
        </span>
      </header>

      <div className="flex flex-1">
        {/* Barra Lateral de Perguntas */}
        <BordaLateral>
          <h2 className="text-xs uppercase text-gray-500 tracking-widest my-3">
            Perguntas
          </h2>
          <ul className="flex flex-col bg-azul/5 rounded-box gap-2 p-2">
            {perguntas.map((q) => (
              <li key={q.id}>
                <div className="flex items-center gap-4 text-md text-azul bg-azul/10 hover:bg-azul/20 py-2.5 px-3 p rounded-lg">
                  <span className="font-bold text-coral">{q.id}.</span>
                  <span className="font-medium text-left">
                    {q.texto_questao}
                  </span>
                </div>
              </li>
            ))}
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
                className={`grid grid-cols-4 w-full transition-all duration-300 ${
                  fase === "virado" ? "gap-0.5" : "gap-3"
                }`}
              >
                {/* Ajuste o grid-cols conforme o número de colunas */}
                {slotsTabuleiro.map((numeroSlot) => {
                  const pecaNoSlot = tabuleiro[numeroSlot];
                  const correcao = resultados[numeroSlot]; // true | false | undefined

                  const idPecaImagem = pecaNoSlot ? pecaNoSlot.id : numeroSlot;

                  // Lógica de cálculo de posição do mosaico (Grid 4x3 para 12 peças)
                  // Coluna varia de 0 a 3, Linha varia de 0 a 2
                  const coluna = (idPecaImagem - 1) % 4;
                  const linha = Math.floor((idPecaImagem - 1) / 4);

                  // Percentuais para mover o background e exibir apenas o pedaço do slot
                  const bgX = (coluna / 3) * 100;
                  const bgY = (linha / 2) * 100;

                  // Estilização dinâmica com Tailwind baseada no estado
                  let bordaCor = "border-white/10 bg-azul/15";
                  if (fase === "virado") {
                    bordaCor = correcao
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10";
                  } else if (pecaNoSlot) {
                    bordaCor = "border-coral/50 bg-laranja/10";
                  }

                  return (
                    <button
                      key={numeroSlot}
                      disabled={fase === "virado"}
                      onClick={() => encaixarNoTabuleiro(numeroSlot)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dropNoTabuleiro(numeroSlot)}
                      className={`w-full aspect-21/9 border-2 border-dashed rounded-xl flex flex-col items-center justify-center relative transition-all ${bordaCor}`}
                    >
                      {/* MODO VIRADO: MOSTRA O VERSO/IMAGEM (ESTILO LUK) */}
                      {fase === "virado" && (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <div
                            className="absolute inset-0 bg-no-repeat transition-all duration-500"
                            style={{
                              backgroundImage: `url(${URL_IMAGEM})`,
                              backgroundSize: "400% 300%", // Como são 4 colunas e 3 linhas, amplia a imagem para cobrir o grid
                              backgroundPosition: `${bgX}% ${bgY}%`,
                              width: "100%",
                              height: "100%",
                              borderRadius: "0.5rem", // Para manter o mesmo arredondamento do botão
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

                      {/* Se estiver jogando e tiver peça */}
                      {fase === "jogando" && pecaNoSlot && (
                        <div className="bg-laranja/20 w-[99%] h-[98%] rounded-xl flex flex-col items-center justify-center p-1 relative">
                          <span className="text-white text-xl font-bold text-center line-clamp-1">
                            {pecaNoSlot.resposta_certa}
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
                        onClick={() => selecionarPeca(peca)}
                        draggable
                        onDragStart={() => iniciarDrag(peca)}
                        /* w-full garante a mesma largura do tabuleiro, h-11 deixa a peça baixinha e achatada */
                        className={`w-full h-11 flex items-center justify-center rounded-xl border text-sm font-medium transition-all cursor-grab active:cursor-grabbing ${
                          estaSelecionada
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

          {/* Barra de Ações (Botões de Virar / Corrigir) */}
          <div className="flex justify-center mt-4">
            {acertouTudo ? (
              <div className="bg-green-500/20 text-green-400 font-bold px-6 py-2 rounded-full border border-green-500/30 animate__animated animate__pulse animate__infinite">
                Parabéns! Você acertou todas!
              </div>
            ) : fase === "jogando" ? (
              <button
                disabled={!todosSlotsPreenchidos}
                onClick={virarTabuleiro}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  todosSlotsPreenchidos
                    ? "bg-coral text-white hover:opacity-90"
                    : "bg-azul/40 text-white cursor-not-allowed"
                }`}
              >
                Virar o Tabuleiro
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={corrigirRespostas}
                  className="bg-azul text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all"
                >
                  ↩ Corrigir respostas
                </button>

                <button
                  onClick={reiniciarJogo}
                  className="bg-coral text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-coral/90 transition-all shadow-md"
                >
                  🗑️ Começar do zero
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
