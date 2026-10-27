import { Link, useOutletContext } from "react-router-dom";
import { useAvatares } from "../../controllers/useAvatares";
import { ProximosAvatares } from "../../components/aluno/ProximosAvatares";
import { progressoNivel } from "../../utils/xp";

// Ainda não existe modelo de conquistas no backend — por enquanto a aba mostra
// os próximos bichinhos a liberar (antes ficavam na home, ocupando a trilha) e
// um placeholder pros selinhos/medalhas que chegam depois.
export function Conquistas() {
  const { aluno } = useOutletContext();
  const { avatares } = useAvatares();
  const { nivel } = progressoNivel(aluno?.xp_total);

  return (
    <main className="pagina pb-16">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        Minhas conquistas
        <span>🏆</span>
      </h1>

      <ProximosAvatares
        avatares={avatares}
        nivel={nivel}
        className="cartao p-5 sm:p-6 mb-6"
        tamanhoAvatar="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl"
      />

      <div className="cartao p-6 sm:p-10 text-center">
        <span className="text-5xl block mb-3 animate__animated animate__bounceIn">🏅</span>
        <p className="text-azul/70 font-semibold text-lg">
          Suas primeiras conquistas aparecem aqui em breve!
        </p>
        <p className="text-azul/55 mt-2 mb-5">
          Continue jogando e ganhando XP, os selinhos e medalhas estão a
          caminho. ✨
        </p>
        <Link
          to="/aluno/historico"
          className="tatil inline-flex items-center gap-2 bg-coral text-branco rounded-2xl px-6 py-3 font-bold"
        >
          Ver suas partidas jogadas
        </Link>
      </div>
    </main>
  );
}

export default Conquistas;
