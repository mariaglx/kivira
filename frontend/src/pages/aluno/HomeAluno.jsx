import { useNavigate, useOutletContext } from "react-router-dom";
import { useHomeAluno } from "../../controllers/useHomeAluno";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";
import { TrilhaFases } from "../../components/aluno/TrilhaFases";
import { MapPinIcon } from "../../components/icons/map-pin";
import { ClipboardListIcon } from "../../components/icons/clipboard-list";

export function HomeAluno() {
  const navigate = useNavigate();
  const { aluno, carregandoAluno } = useOutletContext();
  const { atividades, carregando } = useHomeAluno();

  if (carregandoAluno || carregando) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </main>
    );
  }

  const jogar = (atividadeId) => navigate("/jogo", { state: { atividadeId } });

  return (
    <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 pb-16">
      <div className="bg-branco rounded-3xl p-5 mb-8 flex items-center gap-5 border-2 border-laranja/40 max-w-2xl mx-auto">
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
          <BarraProgresso valor={xpNoNivel(aluno?.xp_total)} max={XP_POR_NIVEL} />
          <p className="text-xs text-azul/60 font-semibold mt-1">
            {xpNoNivel(aluno?.xp_total)}/{XP_POR_NIVEL} XP pro próximo nível
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-black mb-2 flex items-center justify-center gap-2 max-w-2xl mx-auto">
        Sua trilha
        <MapPinIcon size={24} isAnimated={false} />
      </h2>

      {atividades.length === 0 ? (
        <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30 flex flex-col items-center gap-3 max-w-2xl mx-auto">
          <ClipboardListIcon size={32} isAnimated={false} className="text-azul/40" />
          <p className="text-azul/70 font-semibold text-lg">
            Nenhuma atividade disponível ainda. Peça pro seu professor
            publicar uma!
          </p>
        </div>
      ) : (
        <TrilhaFases atividades={atividades} onJogar={jogar} />
      )}
    </main>
  );
}

export default HomeAluno;
