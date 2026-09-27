import { Link } from "react-router-dom";

// Aba nova, ainda sem dado nenhum por trás (não existe modelo de conquistas
// no backend) — placeholder lúdico, mesmo padrão que Historico.jsx usava
// antes de sessao_jogo existir: a aba já aparece na navegação, só o conteúdo
// real chega depois.
export function Conquistas() {
  return (
    <main className="flex-1 min-w-0 px-8 py-8 pb-16">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        Minhas conquistas
        <span>🏆</span>
      </h1>

      <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
        <span className="text-5xl block mb-3">🏅</span>
        <p className="text-azul/70 font-semibold text-lg">
          Suas primeiras conquistas aparecem aqui em breve!
        </p>
        <p className="text-azul/55 mt-2 mb-5">
          Continue jogando e ganhando XP — os selinhos e medalhas estão a
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
