import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, MessageSquare } from "lucide-react";
import { apiRequest } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
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

const TOTAL_PERGUNTAS = PERGUNTAS.length + 1;

// Número da pergunta: a mesma marca em todos os cartões dá ritmo à coluna.
function Numero({ children }) {
  return (
    <span className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-bege text-azul/70 text-xs font-black flex items-center justify-center">
      {children}
    </span>
  );
}

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

  const objetivasRespondidas = PERGUNTAS.filter((p) => notas[p.campo]).length;
  const respondidas = objetivasRespondidas + (comentario.trim() ? 1 : 0);
  const completo = respondidas === TOTAL_PERGUNTAS;

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
    // Uma coluna só, ancorada à esquerda: título, pílula de data e cartões
    // dividem a mesma borda esquerda e a mesma direita. Antes eram três
    // alinhamentos diferentes e o olho não tinha onde se apoiar.
    <main className="pagina flex flex-col gap-6">
      <header className="w-full flex flex-wrap justify-between items-start gap-3">
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

      {/* Duas colunas (padrão do DESIGN_SYSTEM): perguntas à esquerda, painel
          que acompanha a rolagem à direita. O painel dá função ao espaço que
          sobrava e mantém o botão de enviar sempre alcançável. */}
      <form onSubmit={enviar} className="w-full flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4">
          {PERGUNTAS.map((pergunta, indice) => {
          const escolhida = notas[pergunta.campo];
          return (
            <Entrada key={pergunta.campo} delay={indice * 0.05}>
              {/* div com role em vez de fieldset/legend: o <legend> nativo
                  renderiza por cima da borda, fora do padding, e fura o cartão */}
              <div
                role="radiogroup"
                aria-labelledby={`pergunta-${pergunta.campo}`}
                className="cartao p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8"
              >
                {/* Pergunta de um lado, escala do outro: é o formato de matriz
                    de questionário, e é o que preenche a largura do cartão sem
                    esticar os botões. No celular as duas partes empilham. */}
                <div className="lg:flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <Numero>{indice + 1}</Numero>
                    <p
                      id={`pergunta-${pergunta.campo}`}
                      className="font-bold text-azul leading-snug"
                    >
                      {pergunta.titulo}
                    </p>
                  </div>

                  {/* Altura reservada pro selo da resposta, pra nada pular
                      quando a pessoa seleciona */}
                  <div className="h-7 flex items-center ml-10 mt-1">
                    {escolhida && (
                      <span className="rounded-full bg-coral/10 text-coral text-xs font-bold px-3 py-1">
                        {pergunta.opcoes[escolhida - 1]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-80 shrink-0">
                <div className="flex gap-1.5 sm:gap-2">
                  {pergunta.opcoes.map((opcao, posicao) => {
                    const valor = posicao + 1;
                    const marcado = escolhida === valor;
                    return (
                      <label
                        key={valor}
                        className={`flex-1 min-h-11 rounded-xl flex items-center justify-center text-sm font-black cursor-pointer border transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral has-[:focus-visible]:ring-offset-2 ${
                          marcado
                            ? "bg-coral text-branco border-coral shadow-sm"
                            : "bg-bege/50 text-azul/45 border-transparent hover:bg-bege hover:text-azul/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name={pergunta.campo}
                          value={valor}
                          checked={marcado}
                          aria-label={`${valor}, ${opcao}`}
                          onChange={() =>
                            setNotas((atual) => ({ ...atual, [pergunta.campo]: valor }))
                          }
                          className="sr-only"
                        />
                        {valor}
                      </label>
                    );
                  })}
                </div>

                {/* Rótulos das pontas: é o que devolve a direção da escala, que
                    some quando as 5 opções ficam empilhadas na vertical */}
                <div className="flex justify-between mt-2 text-[11px] font-semibold text-azul/40">
                  <span>{pergunta.opcoes[0]}</span>
                  <span>{pergunta.opcoes[pergunta.opcoes.length - 1]}</span>
                </div>
                </div>
              </div>
            </Entrada>
          );
        })}

        <Entrada delay={PERGUNTAS.length * 0.05}>
          <div className="cartao p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <Numero>{TOTAL_PERGUNTAS}</Numero>
              <label htmlFor="comentario" className="font-bold text-azul leading-snug">
                Deixe abaixo sugestões, críticas ou comentários que possam contribuir
                para a melhoria do Kivira.
              </label>
            </div>
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
        </div>

        {/* lg:sticky só no desktop: no celular o painel vira o rodapé natural
            do formulário, logo depois da última pergunta */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
          <div className="cartao p-5 flex flex-col gap-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Progresso
                </span>
                <span className="text-xs font-bold text-azul/50 tabular-nums">
                  {respondidas} de {TOTAL_PERGUNTAS}
                </span>
              </div>
              <BarraProgresso valor={respondidas} max={TOTAL_PERGUNTAS} segmentos />
            </div>

            {erro && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {erro}
              </div>
            )}

            <Button type="submit" disabled={!completo || enviando} className="w-full">
              <MessageSquare size={18} className="mr-2" />
              {enviando ? "Enviando..." : "Enviar feedback"}
            </Button>

            {!completo && (
              <p className="text-xs text-azul/50 font-medium text-center">
                Responda todas para enviar.
              </p>
            )}
          </div>
        </aside>
      </form>
    </main>
  );
}

export default Feedback;
