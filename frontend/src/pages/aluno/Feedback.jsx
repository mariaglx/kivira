import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { Carregando } from "../../components/ui/Carregando";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { Entrada } from "../../components/ui/Animacao";
import { comemorar } from "../../utils/comemorar";

const PERGUNTAS = [
  {
    campo: "diversao",
    titulo: "O que você achou do Kivira?",
    opcoes: [
      { valor: 1, rosto: "😖", rotulo: "Ruim" },
      { valor: 2, rosto: "🙁", rotulo: "Meio ruim" },
      { valor: 3, rosto: "😐", rotulo: "Normal" },
      { valor: 4, rosto: "🙂", rotulo: "Bom" },
      { valor: 5, rosto: "😍", rotulo: "Muito bom" },
    ],
  },
  {
    campo: "autonomia",
    titulo: "Você conseguiu jogar sozinho?",
    opcoes: [
      { valor: 1, rosto: "👎", rotulo: "Não" },
      { valor: 2, rosto: "🤔", rotulo: "Mais ou menos" },
      { valor: 3, rosto: "👍", rotulo: "Sim" },
    ],
  },
  {
    campo: "jogar_de_novo",
    titulo: "Você quer jogar de novo?",
    opcoes: [
      { valor: 1, rosto: "👎", rotulo: "Não" },
      { valor: 2, rosto: "🤔", rotulo: "Talvez" },
      { valor: 3, rosto: "👍", rotulo: "Sim" },
    ],
  },
];

export function Feedback() {
  const { aluno, setAluno, carregandoAluno } = useOutletContext();

  const [respostas, setRespostas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const respondidas = Object.keys(respostas).length;
  const completo = respondidas === PERGUNTAS.length;

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      await apiRequest("/feedback_aluno/", { method: "POST", data: respostas });
      comemorar();
      setAluno({ ...aluno, respondeu_feedback: true });
    } catch (err) {
      if (err.status === 409) {
        setAluno({ ...aluno, respondeu_feedback: true });
      } else {
        setErro("Não deu pra enviar. Tenta de novo!");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoAluno || !aluno) return <Carregando />;

  if (aluno.respondeu_feedback) {
    return (
      <main className="pagina flex flex-col items-center justify-center min-h-[70vh]">
        <Entrada className="cartao text-center py-12 px-8 max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-azul">Valeu!</h2>
          <p className="text-azul/70 font-semibold mt-2">
            A sua resposta vai ajudar o Kivira a ficar melhor.
          </p>
        </Entrada>
      </main>
    );
  }

  return (
    <main className="pagina flex flex-col items-center gap-6 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-azul text-center">
        Conta pra gente!
      </h1>

      {/* Mesmo componente de progresso da tela do professor, pras duas telas de
          feedback falarem a mesma língua */}
      <div className="w-full max-w-xs flex items-center gap-3">
        <BarraProgresso
          valor={respondidas}
          max={PERGUNTAS.length}
          segmentos
          className="flex-1"
        />
        <span className="text-xs font-bold text-azul/50 shrink-0 tabular-nums">
          {respondidas} de {PERGUNTAS.length}
        </span>
      </div>

      {PERGUNTAS.map((pergunta, indice) => (
        <Entrada key={pergunta.campo} delay={indice * 0.08} className="w-full">
          <div
            role="radiogroup"
            aria-labelledby={`pergunta-${pergunta.campo}`}
            className="cartao p-5 sm:p-6"
          >
            <p
              id={`pergunta-${pergunta.campo}`}
              className="font-black text-azul text-center text-lg mb-5"
            >
              {pergunta.titulo}
            </p>

            {/* Alvos grandes: criança tem menos precisão de toque que adulto,
                então os 44px mínimos do design system não bastam aqui */}
            <div className="flex justify-center items-start gap-1 sm:gap-3">
              {pergunta.opcoes.map(({ valor, rosto, rotulo }) => {
                const marcado = respostas[pergunta.campo] === valor;
                return (
                  <label
                    key={valor}
                    className={`flex-1 max-w-24 flex flex-col items-center gap-2 p-1 rounded-2xl cursor-pointer transition-transform has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral has-[:focus-visible]:ring-offset-2 ${
                      marcado ? "scale-110" : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    <input
                      type="radio"
                      name={pergunta.campo}
                      value={valor}
                      checked={marcado}
                      aria-label={rotulo}
                      onChange={() =>
                        setRespostas((atual) => ({ ...atual, [pergunta.campo]: valor }))
                      }
                      className="sr-only"
                    />
                    {/* O círculo por trás é o que marca a escolha: emoji não muda
                        de cor, então sem ele não dá pra ver o que foi escolhido */}
                    <span
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-4xl leading-none transition-colors ${
                        marcado ? "bg-coral/15 ring-2 ring-coral" : "bg-bege/60"
                      }`}
                    >
                      {rosto}
                    </span>
                    <span
                      className={`text-[11px] sm:text-sm font-bold text-center leading-tight ${
                        marcado ? "text-coral" : "text-azul/50"
                      }`}
                    >
                      {rotulo}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </Entrada>
      ))}

      {erro && (
        <div className="cartao w-full p-4 text-center font-bold text-vermelho">{erro}</div>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={!completo || enviando}
        className="tatil w-full bg-coral text-branco [--sombra:var(--color-coral-escuro)] rounded-2xl py-4 text-lg font-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enviando ? "Enviando..." : "Pronto!"}
      </button>

      {!completo && (
        <p className="text-center text-sm font-semibold text-azul/50 -mt-4">
          Responde as três pra enviar.
        </p>
      )}
    </main>
  );
}

export default Feedback;
