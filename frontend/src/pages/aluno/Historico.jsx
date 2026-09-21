import { Sidebar } from "../../components/aluno/Sidebar";
import { useHomeAluno } from "../../controllers/useHomeAluno";

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
        <h1 className="text-3xl font-black mb-6">Seu histórico 📖</h1>

        <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
          <p className="text-azul/70 font-semibold text-lg">
            Ainda não dá pra ver as partidas antigas.
          </p>
          <p className="text-azul/55 mt-2">
            Quando você jogar, o Kivira vai guardar aqui os seus acertos e a sua
            pontuação.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Historico;
