import React from "react";
import { useJogoController } from "../../controllers/useJogoController";
import BordaLateral from "../../components/ui/BordaLateral";

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
  } = useJogoController();

  // Gerar array de slots com base no número de perguntas
  const slotsTabuleiro = perguntas.map((p) => p.id);

  return (
    <div className="min-h-screen bg-bege text-white flex flex-col">
      <header className="flex justify-between bg-branco items-center border-b border-white/10 py-2 px-3">
        <h1 className="text-xl font-bold tracking-wider text-coral">KIVIRA</h1>
        <span className="text-sm text-azul">Sons dos Animais</span>
        <span className="text-sm text-gray-500">
          {Object.keys(tabuleiro).length}/12
        </span>
      </header>

      <div className="flex flex-1">
        {/* Barra Lateral de Perguntas */}
        <BordaLateral>
          <h2 className="text-xs uppercase text-gray-500 tracking-widest my-3">
            Perguntas
          </h2>
          <div className="flex flex-col gap-3">
            {perguntas.map((q) => (
              <div
                key={q.id}
                className="text-xs text-azul bg-azul/5 p-2 rounded border-l-2 border-transparent"
              >
                <span className="text-azul font-bold mr-1">{q.id}.</span>
                {q.texto_questao}
              </div>
            ))}
          </div>
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
              <div className="grid grid-cols-4 gap-3 w-full">
                {/* Ajuste o grid-cols conforme o número de colunas */}
                {slotsTabuleiro.map((numeroSlot) => {
                  const pecaNoSlot = tabuleiro[numeroSlot];
                  const correcao = resultados[numeroSlot]; // true | false | undefined

                  // Estilização dinâmica com Tailwind baseada no estado
                  let bordaCor = "border-white/10 bg-azul/15";
                  if (fase === "virado") {
                    bordaCor = correcao
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10";
                  } else if (pecaNoSlot) {
                    bordaCor = "border-coral/50 bg-coral/10";
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
                      {/* Se estiver virado e correto, mostra o feedback de sucesso (depois entra a imagem) */}
                      {fase === "virado" && correcao && (
                        <span className="text-green-400 font-bold text-sm">
                          ✓ {pecaNoSlot?.resposta_certa}
                        </span>
                      )}
                      {/* Se estiver virado e errado */}
                      {fase === "virado" && !correcao && (
                        <span className="text-red-400 font-bold text-lg">
                          ✗
                        </span>
                      )}

                      {/* Se estiver jogando e tiver peça */}
                      {fase === "jogando" && pecaNoSlot && (
                        <div className="bg-coral/20 w-[99%] h-[98%] rounded-xl flex flex-col items-center justify-center p-1 relative">
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
              <div className="w-full bg-coral/10 border border-white/10 rounded-xl p-2 grid grid-cols-4 gap-3">
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
                            : "bg-laranja/25 border-white/10 hover:border-white/30 text-azul"
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
            {fase === "jogando" ? (
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
              <button
                onClick={corrigirRespostas}
                className="bg-coral text-white px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all"
              >
                ↩ Corrigir respostas
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
