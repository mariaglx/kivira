import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Send } from "lucide-react";
import { apiRequest } from "../../services/api";
import { PERGUNTA_ABERTA_PROFESSOR, PERGUNTAS_PROFESSOR as PERGUNTAS } from "../../utils/feedback";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { Entrada } from "../../components/ui/Animacao";
import { Alerta } from "../../components/ui/Alerta";

const TOTAL_PERGUNTAS = PERGUNTAS.length + 1;

// Número da pergunta: a mesma marca em todos os cartões dá ritmo à coluna.
function Numero({ children, respondida }) {
  return (
    <span
      className={`shrink-0 w-7 h-7 rounded-full font-display text-[13px] font-black flex items-center justify-center ${
        respondida ? "bg-coral text-azul-escuro" : "bg-bege text-azul"
      }`}
    >
      {children}
    </span>
  );
}

// ["2", "3", "4"] -> "2, 3 e 4"
function juntar(partes) {
  return partes.length <= 1 ? partes.join("") : `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
}

export function Feedback() {
  const { professor, setProfessor, carregandoProfessor } = useOutletContext();

  const [notas, setNotas] = useState({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

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
          <div className="w-14 h-14 rounded-2xl bg-cie-bg text-cie-fg-escuro flex items-center justify-center mx-auto mb-4">
            <Check size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-azul">Feedback enviado</h2>
          <p className="text-azul/80 text-sm mt-2">
            Obrigado por contribuir com o Kivira.
          </p>
        </Entrada>
      </main>
    );
  }

  // "Falta: perguntas 2, 3 e o comentário."
  const faltando = PERGUNTAS.map((p, i) => (notas[p.campo] ? null : i + 1)).filter(Boolean);
  const partesFalta = [
    faltando.length ? `${faltando.length === 1 ? "pergunta" : "perguntas"} ${juntar(faltando.map(String))}` : null,
    comentario.trim() ? null : "o comentário",
  ].filter(Boolean);

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-black text-azul">Conte o que você achou</h1>
        <p className="text-sm text-azul/80">{TOTAL_PERGUNTAS} perguntas, leva uns 2 minutos</p>
      </header>

      {/* Duas colunas: perguntas à esquerda, painel que acompanha a rolagem à
          direita com o progresso e o botão de enviar sempre alcançável. */}
      <form onSubmit={enviar} className="w-full flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-3">
          {PERGUNTAS.map((pergunta, indice) => {
            const escolhida = notas[pergunta.campo];
            return (
              <Entrada key={pergunta.campo} delay={indice * 0.05}>
                {/* div com role em vez de fieldset/legend: o <legend> nativo
                    renderiza por cima da borda, fora do padding, e fura o cartão */}
                <div role="radiogroup" aria-labelledby={`pergunta-${pergunta.campo}`} className="cartao @container px-4 sm:px-5 py-4 flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <Numero respondida={Boolean(escolhida)}>{indice + 1}</Numero>
                    <p id={`pergunta-${pergunta.campo}`} className="font-bold text-azul leading-snug">
                      {pergunta.titulo}
                    </p>
                  </div>
                  {/* Os 5 rótulos ficam sempre à vista. Card estreito (celular, ou
                      desktop espremido entre menu e painel): lista vertical com
                      número e rótulo lado a lado. Só com espaço (@container ≥ 36rem)
                      vira as 5 colunas com o rótulo embaixo do número. */}
                  <div className="flex flex-col gap-1.5 @xl:grid @xl:grid-cols-5">
                    {pergunta.opcoes.map((opcao, posicao) => {
                      const valor = posicao + 1;
                      const marcado = escolhida === valor;
                      return (
                        <label
                          key={valor}
                          className={`min-h-11 rounded-xl px-3 py-2 flex items-center gap-3 text-left cursor-pointer border-[1.5px] transition-colors @xl:min-h-16 @xl:px-1.5 @xl:py-2.5 @xl:flex-col @xl:justify-start @xl:gap-1 @xl:text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral has-[:focus-visible]:ring-offset-2 ${
                            marcado ? "border-coral bg-por-bg" : "border-cinza-claro hover:border-coral/60"
                          }`}
                        >
                          <input
                            type="radio"
                            name={pergunta.campo}
                            value={valor}
                            checked={marcado}
                            aria-label={`${valor}, ${opcao}`}
                            onChange={() => setNotas((atual) => ({ ...atual, [pergunta.campo]: valor }))}
                            className="sr-only"
                          />
                          <span className="w-5 shrink-0 text-center font-display font-black text-base text-azul">{valor}</span>
                          <span className="text-sm @xl:text-xs font-bold text-azul leading-tight">{opcao}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </Entrada>
            );
          })}

          <Entrada delay={PERGUNTAS.length * 0.05}>
            <div className="cartao px-4 sm:px-5 py-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <Numero respondida={Boolean(comentario.trim())}>{TOTAL_PERGUNTAS}</Numero>
                <label htmlFor="comentario" className="font-bold text-azul leading-snug flex-1">
                  {PERGUNTA_ABERTA_PROFESSOR}
                </label>
                <span className="shrink-0 rounded-full bg-por-bg text-coral-texto text-xs font-bold px-2.5 py-0.5">Obrigatória</span>
              </div>
              <textarea
                id="comentario"
                value={comentario}
                onChange={(evento) => setComentario(evento.target.value)}
                maxLength={5000}
                rows={4}
                required
                placeholder="Escreva aqui"
                className="w-full rounded-xl bg-branco border border-cinza-claro p-3 text-sm text-azul placeholder:text-azul/75 resize-y"
              />
            </div>
          </Entrada>
        </div>

        {/* lg:sticky só no desktop: no celular o painel vira o rodapé natural
            do formulário, logo depois da última pergunta */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-6">
          <div className="cartao p-4 sm:p-5 flex flex-col gap-3">
            <span className="rotulo">Progresso</span>
            <p className="font-display font-black text-2xl text-azul -mt-1">
              {respondidas} de {TOTAL_PERGUNTAS}
            </p>
            <BarraProgresso valor={respondidas} max={TOTAL_PERGUNTAS} segmentos trilha="bg-cinza-claro" preenchimento="bg-coral" />
            {!completo && <p className="text-sm text-azul/80">Falta: {juntar(partesFalta)}.</p>}

            {erro && <Alerta>{erro}</Alerta>}

            <Button type="submit" disabled={!completo || enviando} className="w-full gap-2 font-display font-extrabold">
              <Send size={17} />
              {enviando ? "Enviando..." : "Enviar feedback"}
            </Button>
          </div>
        </aside>
      </form>
    </main>
  );
}

export default Feedback;
