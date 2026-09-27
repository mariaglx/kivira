import { useState } from "react";
import { CheckIcon } from "../icons/check";
import { LockIcon } from "../icons/lock";
import { BlocksIcon } from "../icons/blocks";
import { DIFICULDADE_ESTRELAS } from "../../utils/dificuldade";
import { iconeDisciplina } from "../../utils/disciplina";

const ALTURA_LINHA = 148; // px entre o centro de uma fase e a próxima
const TAMANHO_NO = 76; // px, fase concluída/bloqueada
const TAMANHO_NO_ATUAL = 92; // px, fase liberada — nódulo maior (pede o pedido)
const IMAGEM_PADRAO = "/img/resultado.png";

// Zigue-zague estilo Duolingo: 4 posições horizontais (% da largura) que se
// repetem a cada 4 fases, formando uma trilha sinuosa sem precisar medir o
// DOM — a mesma % também é usada nos pontos do SVG do caminho, então os dois
// sempre casam.
const POSICOES_X = [50, 76, 50, 24];
const xDaFase = (indice) => POSICOES_X[indice % POSICOES_X.length];

function caminhoSvg(atividades) {
  const pontos = atividades.map((_, i) => ({
    x: xDaFase(i),
    y: i * ALTURA_LINHA + ALTURA_LINHA / 2,
  }));

  let d = `M ${pontos[0].x},${pontos[0].y}`;
  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];
    // Curva em L suave: primeiro desce reto a partir do ponto anterior, só
    // depois vira pro x da próxima fase — dá o efeito de caminho sinuoso.
    d += ` Q ${anterior.x},${atual.y} ${atual.x},${atual.y}`;
  }
  return d;
}

function CardPreview({ atividade, onJogar, alinhamento }) {
  const estrelas = DIFICULDADE_ESTRELAS[atividade.dificuldade] || 1;
  const alinhamentoClasse =
    alinhamento === "esquerda"
      ? "left-0"
      : alinhamento === "direita"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute z-20 top-full mt-3 w-64 bg-branco rounded-3xl shadow-xl border border-cinza-claro/20 p-4 animate__animated animate__zoomIn ${alinhamentoClasse}`}
      style={{ animationDuration: "0.25s" }}
    >
      <div className="w-full h-24 rounded-2xl overflow-hidden mb-3">
        <img
          src={atividade.imagem_atividade_url || IMAGEM_PADRAO}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-extrabold text-azul leading-tight mb-1">{atividade.titulo}</h3>
      <p className="text-xs text-azul/50 font-medium mb-2">
        {iconeDisciplina(atividade.disciplina)} {atividade.disciplina}
      </p>
      <p className="text-amber-500 text-sm mb-3">
        {"⭐".repeat(estrelas)}
        <span className="opacity-25">{"⭐".repeat(3 - estrelas)}</span>
      </p>
      <button
        type="button"
        onClick={onJogar}
        className="tatil w-full bg-coral text-branco rounded-2xl py-2.5 font-bold inline-flex items-center justify-center gap-2"
      >
        Jogar!
        <BlocksIcon size={16} isAnimated={false} />
      </button>
    </div>
  );
}

// Mapa de fases estilo "trilha de jogo" (Duolingo/Mario): cada atividade é um
// nódulo — concluída, liberada (a próxima da fila) ou bloqueada — conectados
// por um caminho pontilhado sinuoso desenhado em SVG.
export function TrilhaFases({ atividades, onJogar }) {
  const [faseAberta, setFaseAberta] = useState(null);
  const indiceAtual = atividades.findIndex((a) => !a.concluida);
  const alturaTotal = atividades.length * ALTURA_LINHA;

  return (
    <div className="relative mx-auto max-w-2xl pb-16" style={{ height: alturaTotal }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 100 ${alturaTotal}`}
        preserveAspectRatio="none"
      >
        <path
          d={caminhoSvg(atividades)}
          fill="none"
          stroke="#eeb37f"
          strokeWidth="3"
          strokeDasharray="10 10"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {atividades.map((atividade, indice) => {
        const estado = atividade.concluida ? "concluida" : indice === indiceAtual ? "atual" : "bloqueada";
        const tamanho = estado === "atual" ? TAMANHO_NO_ATUAL : TAMANHO_NO;
        const x = xDaFase(indice);
        const aberta = faseAberta === atividade.id;

        const corNo =
          estado === "concluida"
            ? "bg-verde"
            : estado === "atual"
              ? "bg-coral"
              : "bg-cinza-claro";

        return (
          <div
            key={atividade.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: indice * ALTURA_LINHA + ALTURA_LINHA / 2, left: `${x}%` }}
          >
            <button
              type="button"
              disabled={estado === "bloqueada"}
              onClick={() => setFaseAberta(aberta ? null : atividade.id)}
              aria-label={`Fase ${indice + 1}: ${atividade.titulo}`}
              style={{ width: tamanho, height: tamanho }}
              className={`relative rounded-full flex items-center justify-center shadow-lg border-4 border-branco transition-transform ${corNo} ${
                estado === "bloqueada" ? "cursor-not-allowed opacity-60" : "hover:scale-105"
              } ${estado === "atual" ? "animate__animated animate__pulse animate__infinite" : ""}`}
            >
              {estado === "concluida" && <CheckIcon size={30} isAnimated={false} color="#fff" />}
              {estado === "atual" && <BlocksIcon size={34} isAnimated={false} color="#fff" />}
              {estado === "bloqueada" && <LockIcon size={26} isAnimated={false} color="#8a8a8a" />}

              <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-branco text-azul text-[11px] font-black flex items-center justify-center shadow border border-cinza-claro/30">
                {indice + 1}
              </span>
            </button>

            {estado === "concluida" && (
              <p className="text-center text-amber-500 text-xs mt-1">
                {"⭐".repeat(DIFICULDADE_ESTRELAS[atividade.dificuldade] || 1)}
              </p>
            )}

            {aberta && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFaseAberta(null)} />
                <CardPreview
                  atividade={atividade}
                  onJogar={() => onJogar(atividade.id)}
                  alinhamento={x <= 30 ? "esquerda" : x >= 70 ? "direita" : "centro"}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
