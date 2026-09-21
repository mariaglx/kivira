import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useHomeAluno } from "../../controllers/useHomeAluno";
import { identificarDisciplina } from "../../utils/disciplina";
import { PlayIcon } from "../../components/icons/play";
import { RefreshCwIcon } from "../../components/icons/refresh-cw";
import { StarIcon } from "../../components/icons/star";

const TIPO_LABEL = {
  multipla_escolha: "Múltipla escolha",
  associacao: "Associação",
  arrastar_soltar: "Arrastar e soltar",
};

const DIFICULDADE_STYLE = {
  facil: "bg-green-100 text-green-600",
  medio: "bg-amber-100 text-amber-600",
  dificil: "bg-red-100 text-red-500",
};

// Selo colorido que identifica a disciplina da atividade — flutua sobre a capa
// (imagem real, quando existe) ou centraliza numa capa colorida (quando não existe)
function SeloDisciplina({ disciplina, comImagem }) {
  const { Icon, fg } = identificarDisciplina(disciplina);

  return (
    <div
      className={`${comImagem ? "absolute top-3 left-3 w-11 h-11 rounded-xl bg-branco shadow-md" : "w-14 h-14"} flex items-center justify-center shrink-0`}
    >
      <Icon size={comImagem ? 22 : 30} isAnimated={false} className={fg} />
    </div>
  );
}

function CardAtividade({ atividade, onJogar }) {
  const { concluida, imagem_atividade_url: imagem } = atividade;
  const { bg } = identificarDisciplina(atividade.disciplina);

  return (
    <article className="bg-branco rounded-3xl shadow-sm border border-cinza-claro/20 flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className={`relative h-28 flex items-center px-5 ${imagem ? "" : bg}`}>
        {imagem ? (
          <img src={imagem} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="mx-auto">
            <SeloDisciplina disciplina={atividade.disciplina} comImagem={false} />
          </div>
        )}
        {imagem && <SeloDisciplina disciplina={atividade.disciplina} comImagem />}

        {concluida && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-branco text-ouro-fg-escuro text-xs font-bold pl-2 pr-2.5 py-1 rounded-full shadow-md">
            <StarIcon size={13} isAnimated={false} />
            Feita!
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">{atividade.titulo}</h3>
          <span className="text-xs text-azul/50 font-semibold">{atividade.disciplina}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-azul/60 bg-bege px-2.5 py-1 rounded-md">
            {TIPO_LABEL[atividade.tipo_atividade]}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${DIFICULDADE_STYLE[atividade.dificuldade]}`}>
            {atividade.dificuldade}
          </span>
        </div>

        <button
          type="button"
          onClick={onJogar}
          className={`font-display mt-auto w-full flex items-center justify-center gap-2 rounded-full py-3 font-bold text-[15px] transition-transform hover:scale-[1.02] active:scale-95 ${
            concluida ? "bg-ouro-bg text-ouro-fg-escuro" : "bg-coral text-branco"
          }`}
        >
          {concluida ? (
            <>
              <RefreshCwIcon size={17} isAnimated={false} />
              Jogar de novo
            </>
          ) : (
            <>
              <PlayIcon size={17} isAnimated={false} />
              Jogar
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function HomeAluno() {
  const navigate = useNavigate();
  const { aluno, atividades, carregando, sair } = useHomeAluno();

  if (carregando) {
    return (
      <div className="min-h-screen bg-bege flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const jogar = (atividadeId) => navigate("/jogo", { state: { atividadeId } });

  const pendentes = atividades.filter((a) => !a.concluida);
  const concluidas = atividades.filter((a) => a.concluida);

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar aluno={aluno} onSair={sair} />

      <main className="flex-1 min-w-0 px-10 py-10 pb-16">
        <div className="mb-9">
          <h1 className="font-display text-[34px] font-bold leading-tight">Suas atividades</h1>
          <p className="text-azul/50 font-medium mt-1">
            Continue de onde parou ou jogue de novo pra treinar.
          </p>
        </div>

        {atividades.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
            <p className="text-azul/70 font-semibold text-lg">
              Nenhuma atividade disponível ainda. Peça pro seu professor publicar uma!
            </p>
          </div>
        ) : (
          <>
            <section>
              <span className="font-display inline-flex items-center gap-2 bg-por-bg text-por-fg-escuro text-sm font-bold px-4 py-1.5 rounded-full mb-5">
                Pra fazer
              </span>

              {pendentes.length === 0 ? (
                <div className="bg-branco rounded-3xl p-8 flex flex-col items-center gap-2 text-center border-2 border-dashed border-cinza-claro">
                  <div className="w-12 h-12 rounded-full bg-ouro-bg text-ouro-fg-escuro flex items-center justify-center mb-1">
                    <StarIcon size={22} isAnimated={false} />
                  </div>
                  <h3 className="font-display font-bold text-base">Você jogou tudo!</h3>
                  <p className="text-sm text-azul/50 font-medium">
                    Peça pro seu professor liberar novas atividades.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendentes.map((atividade) => (
                    <CardAtividade
                      key={atividade.id}
                      atividade={atividade}
                      onJogar={() => jogar(atividade.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {concluidas.length > 0 && (
              <section className="mt-11">
                <span className="font-display inline-flex items-center gap-2 bg-ouro-bg text-ouro-fg-escuro text-sm font-bold px-4 py-1.5 rounded-full mb-5">
                  Jogar de novo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {concluidas.map((atividade) => (
                    <CardAtividade
                      key={atividade.id}
                      atividade={atividade}
                      onJogar={() => jogar(atividade.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default HomeAluno;
