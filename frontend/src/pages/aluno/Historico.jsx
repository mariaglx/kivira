import { Link } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useHomeAluno } from "../../controllers/useHomeAluno";
import { BlocksIcon } from "../../components/icons/blocks";
import { BookOpenIcon } from "../../components/icons/book-open";

// Tela aguardando a entidade `sessao_jogo`, que ainda não existe no backend
// (sem modelo e sem tabela). Enquanto nada registra as partidas, não há
// histórico pra mostrar — a tela existe pra o item do menu não levar a lugar
// nenhum, e some daqui assim que a gravação de sessões entrar.
export function Historico() {
  const { aluno, carregando, sair } = useHomeAluno();

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
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          Seu histórico
          <BookOpenIcon size={22} isAnimated={false} />
        </h1>

        <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
          <BookOpenIcon size={40} isAnimated={false} className="mx-auto mb-3 text-azul/40" />
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
            <BlocksIcon size={18} isAnimated={false} />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Historico;
