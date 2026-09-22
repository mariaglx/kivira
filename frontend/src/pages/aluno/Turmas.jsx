import { Link } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useTurmasAluno } from "../../controllers/useTurmasAluno";
import { UsersIcon } from "../../components/icons/users";

export function Turmas() {
  const { aluno, turmas, carregando, sair } = useTurmasAluno();

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
        <h1 className="text-3xl font-black mb-6 flex items-center gap-2">
          Suas turmas
          <UsersIcon size={26} isAnimated={false} />
        </h1>

        {turmas.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
            <p className="text-azul/70 font-semibold text-lg">
              Você ainda não está em nenhuma turma. Peça o código pro seu
              professor!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma) => (
              <Link
                key={turma.id}
                to={`/aluno/turmas/${turma.id}`}
                className="bg-branco rounded-3xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <h3 className="text-lg font-extrabold">{turma.nome}</h3>
                  <span className="text-xs text-azul/50 font-medium">
                    {turma.ano_escolar} · {turma.ano_letivo}
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-bege/60 rounded-2xl p-3 mt-auto">
                  <div className="w-10 h-10 rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase shrink-0">
                    {turma.professor_avatar_url ? (
                      <img
                        src={`/avatares/${turma.professor_avatar_url}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (turma.professor_nome || "P").charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-azul/50">
                      Professor(a)
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {turma.professor_nome || "—"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Turmas;
