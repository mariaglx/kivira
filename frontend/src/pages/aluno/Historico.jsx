import { Link, useOutletContext } from "react-router-dom";
import { useHistoricoAluno } from "../../controllers/useHistoricoAluno";
import { DIFICULDADE_LABEL, DIFICULDADE_EMOJI } from "../../utils/dificuldade";
import { Blocks, BookOpen } from "lucide-react";
import { Carregando } from "../../components/ui/Carregando";

function formatarData(dataIso) {
  return new Date(dataIso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Historico() {
  const { carregandoAluno } = useOutletContext();
  const { sessoes, carregando } = useHistoricoAluno();

  if (carregandoAluno || carregando) {
    return <Carregando />;
  }

  return (
    <>
      <main className="pagina pb-16">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          Seu histórico
          <BookOpen size={22} />
        </h1>

        {sessoes.length === 0 ? (
          <div className="cartao p-6 sm:p-10 text-center">
            <BookOpen size={40} className="mx-auto mb-3 text-azul/40" />
            <p className="text-azul/70 font-semibold text-lg">
              Ainda não dá pra ver as partidas antigas.
            </p>
            <p className="text-azul/55 mt-2 mb-5">
              Quando você jogar, o Kivira vai guardar aqui os seus acertos, suas
              estrelas e o seu XP.
            </p>
            <Link
              to="/aluno/home"
              className="tatil inline-flex items-center gap-2 bg-coral text-branco rounded-2xl px-6 py-3 font-bold"
            >
              Jogar agora
              <Blocks size={18} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessoes.map((sessao) => (
              <div
                key={sessao.id}
                className="bg-branco rounded-2xl p-4 shadow-sm border border-cinza-claro/30 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold truncate">
                    {sessao.atividade_titulo || "Atividade removida"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-bold text-azul/60 bg-bege px-2.5 py-1 rounded-md">
                      {DIFICULDADE_EMOJI[sessao.dificuldade]} {DIFICULDADE_LABEL[sessao.dificuldade] || sessao.dificuldade}
                    </span>
                    <span className="text-xs text-azul/50 font-medium">
                      {formatarData(sessao.data_criacao)}
                    </span>
                  </div>
                </div>

                <div className="text-lg shrink-0" title={`${sessao.estrelas} de 3 estrelas`}>
                  {"⭐".repeat(sessao.estrelas)}
                  <span className="opacity-20">{"⭐".repeat(3 - sessao.estrelas)}</span>
                </div>

                <span className="shrink-0 bg-verde/15 text-verde font-black text-sm px-3 py-1.5 rounded-xl">
                  +{sessao.xp_ganho} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Historico;
