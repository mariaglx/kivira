import { useNavigate, useOutletContext } from "react-router-dom";
import { useHomeAluno } from "../../controllers/useHomeAluno";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { progressoNivel } from "../../utils/xp";
import { useAvatares } from "../../controllers/useAvatares";
import { ProximosAvatares } from "../../components/aluno/ProximosAvatares";
import { TrilhaFases } from "../../components/aluno/TrilhaFases";
import { MapPin, ClipboardList } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Carregando } from "../../components/ui/Carregando";
import { Entrada } from "../../components/ui/Animacao";

export function HomeAluno() {
  const navigate = useNavigate();
  const { aluno, carregandoAluno } = useOutletContext();
  const { atividades, carregando } = useHomeAluno();
  const { avatares } = useAvatares();
  const progresso = progressoNivel(aluno?.xp_total);

  if (carregandoAluno || carregando) {
    return <Carregando />;
  }

  const jogar = (atividadeId) => navigate("/jogo", { state: { atividadeId } });

  return (
    <main className="pagina pb-16">
      <Entrada className="bg-branco rounded-3xl p-4 sm:p-5 mb-8 flex items-center gap-4 sm:gap-5 border-2 border-laranja/40 max-w-2xl mx-auto">
        <Avatar
          arquivo={aluno?.avatar_url}
          nome={aluno?.apelido || aluno?.nome_completo || "A"}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-2xl ring-4 ring-laranja"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-black truncate">
            Oi, {aluno?.apelido || aluno?.nome_completo}! 👋
          </h1>
          <p className="text-sm font-bold text-coral mb-2">Nível {progresso.nivel}</p>
          <BarraProgresso valor={progresso.xpNoNivel} max={progresso.xpDoNivel} />
          <p className="text-xs text-azul/60 font-semibold mt-1">
            {progresso.xpNoNivel}/{progresso.xpDoNivel} XP pro próximo nível
          </p>
          <ProximosAvatares avatares={avatares} nivel={progresso.nivel} />
        </div>
      </Entrada>

      <h2 className="text-2xl font-black mb-2 flex items-center justify-center gap-2 max-w-2xl mx-auto">
        Sua trilha
        <MapPin size={24} />
      </h2>

      {atividades.length === 0 ? (
        <div className="cartao p-6 sm:p-10 text-center flex flex-col items-center gap-3 max-w-2xl mx-auto">
          <ClipboardList size={32} className="text-azul/40" />
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
