import { useNavigate } from "react-router-dom";
import { LogoKivira } from "../../components/LogoKivira";
import { useHomeAluno } from "../../controllers/useHomeAluno";

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

  return (
    <div className="min-h-screen bg-bege text-azul font-sans">
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <LogoKivira className="h-14 w-auto" />

        <div className="flex items-center gap-4">
          {aluno?.avatar_url && (
            <img
              src={`/avatares/${aluno.avatar_url}`}
              alt="Seu avatar"
              className="w-12 h-12 rounded-full border-2 border-coral object-cover"
            />
          )}
          <div className="text-right">
            <p className="font-extrabold leading-tight">
              {aluno?.apelido || aluno?.nome_completo}
            </p>
            <p className="text-xs text-azul/60 font-semibold">
              Nível {aluno?.nivel_atual} · {aluno?.xp_total} XP
            </p>
          </div>
          <button
            type="button"
            onClick={sair}
            className="text-xs font-bold text-azul/50 hover:text-coral transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <h1 className="text-3xl font-black mb-6">Suas atividades 🎲</h1>

        {atividades.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
            <p className="text-azul/70 font-semibold text-lg">
              Nenhuma atividade disponível ainda. Peça pro seu professor
              publicar uma! 🎨
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividades.map((atividade) => (
              <div
                key={atividade.id}
                className="bg-branco rounded-3xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {atividade.imagem_atividade_url && (
                  <img
                    src={atividade.imagem_atividade_url}
                    alt=""
                    className="w-full h-32 object-cover rounded-2xl"
                  />
                )}

                <div>
                  <h3 className="text-lg font-extrabold">
                    {atividade.titulo}
                  </h3>
                  <span className="text-xs text-azul/50 font-medium">
                    {atividade.disciplina}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-azul/60 bg-bege px-2.5 py-1 rounded-md">
                    {TIPO_LABEL[atividade.tipo_atividade]}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${DIFICULDADE_STYLE[atividade.dificuldade]}`}
                  >
                    {atividade.dificuldade}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/jogo", { state: { atividadeId: atividade.id } })
                  }
                  className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-2xl py-3 h-auto min-h-0 font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                >
                  Jogar! 🚀
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default HomeAluno;
