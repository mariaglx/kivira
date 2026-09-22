import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useHomeAluno } from "../../controllers/useHomeAluno";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";
import { BlocksIcon } from "../../components/icons/blocks";
import { ClipboardListIcon } from "../../components/icons/clipboard-list";

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

// Mesmo mosaico padrão usado no jogo (useJogo) quando a atividade não tem
// imagem própria — assim todo card mostra uma prévia, nunca fica "vazio".
const IMAGEM_PADRAO = "/img/resultado.png";

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
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar aluno={aluno} onSair={sair} />

      <main className="flex-1 min-w-0 px-8 py-8 pb-16">
        <div className="bg-branco rounded-3xl p-5 mb-8 flex items-center gap-5 border-2 border-laranja/40">
          <div className="w-16 h-16 rounded-2xl bg-coral overflow-hidden flex items-center justify-center text-2xl font-black text-branco uppercase ring-4 ring-laranja shrink-0">
            {aluno?.avatar_url ? (
              <img
                src={`/avatares/${aluno.avatar_url}`}
                alt="Seu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (aluno?.apelido || aluno?.nome_completo || "A").charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black truncate">
              Oi, {aluno?.apelido || aluno?.nome_completo}! 👋
            </h1>
            <p className="text-sm font-bold text-coral mb-2">Nível {aluno?.nivel_atual}</p>
            <BarraProgresso
              valor={xpNoNivel(aluno?.xp_total)}
              max={XP_POR_NIVEL}
              className="max-w-sm"
            />
            <p className="text-xs text-azul/60 font-semibold mt-1">
              {xpNoNivel(aluno?.xp_total)}/{XP_POR_NIVEL} XP pro próximo nível
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
          Suas atividades
          <BlocksIcon size={24} isAnimated={false} />
        </h2>

        {atividades.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30 flex flex-col items-center gap-3">
            <ClipboardListIcon size={32} isAnimated={false} className="text-azul/40" />
            <p className="text-azul/70 font-semibold text-lg">
              Nenhuma atividade disponível ainda. Peça pro seu professor
              publicar uma!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {atividades.map((atividade) => (
              <div
                key={atividade.id}
                className="group bg-branco rounded-3xl p-6 shadow-sm border-2 border-transparent flex flex-col gap-4 hover:border-laranja hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <div className="w-full h-32 rounded-2xl overflow-hidden">
                  <img
                    src={atividade.imagem_atividade_url || IMAGEM_PADRAO}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

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
                  className="tatil mt-auto bg-coral text-branco rounded-2xl py-3 font-bold inline-flex items-center justify-center gap-2"
                >
                  Jogar!
                  <BlocksIcon size={18} isAnimated={false} />
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
