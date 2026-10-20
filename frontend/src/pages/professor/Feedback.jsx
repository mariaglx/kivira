import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, MessageSquare } from "lucide-react";
import { apiRequest } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { Entrada } from "../../components/ui/Animacao";

const PERGUNTAS = [
  {
    campo: "facilidade_uso",
    titulo: "Foi fácil entender como utilizar o Kivira?",
    opcoes: ["Muito difícil", "Difícil", "Neutro", "Fácil", "Muito fácil"],
  },
  {
    campo: "autonomia_aluno",
    titulo: "Você acha que o aluno consegue jogar no Kivira sozinho, sem precisar de ajuda?",
    opcoes: [
      "Não consegue",
      "Consegue com dificuldade",
      "Neutro",
      "Consegue",
      "Consegue tranquilamente",
    ],
  },
  {
    campo: "alinhamento_conteudo",
    titulo: "Os conteúdos que você consegue montar no Kivira atendem o que você precisa ensinar?",
    opcoes: ["Não atendem", "Atendem pouco", "Neutro", "Atendem", "Atendem totalmente"],
  },
  {
    campo: "usaria_nas_aulas",
    titulo: "Você usaria o Kivira nas suas aulas?",
    opcoes: [
      "Com certeza não",
      "Provavelmente não",
      "Talvez",
      "Provavelmente sim",
      "Com certeza sim",
    ],
  },
];

export function Feedback() {
  const { professor, setProfessor, carregandoProfessor } = useOutletContext();

  const [notas, setNotas] = useState({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const completo =
    PERGUNTAS.every((pergunta) => notas[pergunta.campo]) && comentario.trim().length > 0;

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await apiRequest("/feedback/", {
        method: "POST",
        data: { ...notas, comentario: comentario.trim() },
      });
      setProfessor({ ...professor, respondeu_feedback: true });
    } catch (err) {
      // 409 é "já respondeu": não é erro pra mostrar, o resultado desejado já é o fato
      if (err.status === 409) {
        setProfessor({ ...professor, respondeu_feedback: true });
      } else {
        setErro(err.message || "Não foi possível enviar. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoProfessor || !professor) return <Carregando />;

  if (professor.respondeu_feedback) {
    return (
      <main className="pagina flex flex-col gap-6">
        <Entrada className="cartao text-center py-12 px-6 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-verde/15 text-verde flex items-center justify-center mx-auto mb-4">
            <Check size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-azul">Feedback enviado</h2>
          <p className="text-azul/70 text-sm mt-2">
            Obrigado por contribuir com o Kivira.
          </p>
        </Entrada>
      </main>
    );
  }

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">
            Feedback
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-azul mt-1">
            Conte o que você achou
          </h2>
        </div>

        <div className="hidden sm:block bg-branco px-4 py-2 rounded-xl border border-cinza-claro text-xs font-semibold text-azul shadow-sm">
          {dataHoje}
        </div>
      </header>

      <form onSubmit={enviar} className="flex flex-col gap-4 lg:gap-6 max-w-3xl">
        {PERGUNTAS.map((pergunta, indice) => (
          <Entrada key={pergunta.campo} delay={indice * 0.05}>
            {/* div com role em vez de fieldset/legend: o <legend> nativo renderiza
                por cima da borda, fora do padding, e furava o cartão */}
            <div
              role="radiogroup"
              aria-labelledby={`pergunta-${pergunta.campo}`}
              className="cartao p-5 sm:p-6"
            >
              <p id={`pergunta-${pergunta.campo}`} className="font-bold text-azul mb-4">
                {indice + 1}. {pergunta.titulo}
              </p>

              <div className="flex flex-col gap-2">
                {pergunta.opcoes.map((opcao, posicao) => {
                  const valor = posicao + 1;
                  const marcado = notas[pergunta.campo] === valor;
                  return (
                    <label
                      key={valor}
                      className={`flex items-center gap-3 min-h-11 px-3 rounded-xl cursor-pointer border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral ${
                        marcado
                          ? "bg-coral/10 border-coral"
                          : "bg-bege/40 border-transparent hover:bg-bege"
                      }`}
                    >
                      <input
                        type="radio"
                        name={pergunta.campo}
                        value={valor}
                        checked={marcado}
                        onChange={() =>
                          setNotas((atual) => ({ ...atual, [pergunta.campo]: valor }))
                        }
                        className="sr-only"
                      />
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          marcado ? "bg-coral text-branco" : "bg-branco text-azul/50"
                        }`}
                      >
                        {valor}
                      </span>
                      <span
                        className={`text-sm ${
                          marcado ? "font-bold text-azul" : "font-medium text-azul/70"
                        }`}
                      >
                        {opcao}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Entrada>
        ))}

        <Entrada delay={PERGUNTAS.length * 0.05}>
          <div className="cartao p-5 sm:p-6">
            <label htmlFor="comentario" className="block font-bold text-azul mb-4">
              5. Deixe abaixo sugestões, críticas ou comentários que possam contribuir
              para a melhoria do Kivira.
            </label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Escreva aqui"
              className="w-full rounded-xl bg-bege/40 border border-cinza-claro p-3 text-sm text-azul placeholder:text-azul/40 focus:outline-none focus:ring-2 focus:ring-coral resize-y"
            />
          </div>
        </Entrada>

        {erro && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
            {erro}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!completo || enviando} className="px-6">
            <MessageSquare size={18} className="mr-2" />
            {enviando ? "Enviando..." : "Enviar feedback"}
          </Button>
          {!completo && (
            <p className="text-xs text-azul/50 font-medium">
              Responda todas as perguntas para enviar.
            </p>
          )}
        </div>
      </form>
    </main>
  );
}

export default Feedback;
