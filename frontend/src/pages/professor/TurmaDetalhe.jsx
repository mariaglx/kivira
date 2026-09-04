import { Link } from "react-router-dom";
import { useTurmaDetalhe } from "../../controllers/useTurmaDetalhe";

export function TurmaDetalhe() {
  const { id, turma, alunos, atividades, carregando, erro } = useTurmaDetalhe();

  if (carregando) {
    return (
      <main className="flex-1 p-8">
        <p className="text-azul/60">Carregando...</p>
      </main>
    );
  }

  if (erro || !turma) {
    return (
      <main className="flex-1 p-8">
        <p className="text-red-600">{erro || "Turma não encontrada"}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/professor/turmas"
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            ← Turmas
          </Link>
        </div>
        <Link
          to={`/professor/turmas/${id}/editar`}
          className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl px-5 py-2 font-bold text-sm transition-all active:scale-95"
        >
          Editar turma
        </Link>
      </header>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{turma.nome}</h2>
          <p className="text-azul/60 text-sm">{turma.ano_escolar} · {turma.ano_letivo}</p>
        </div>
        {turma.ativo ? (
          <span className="badge bg-green-100 text-green-600 border-none rounded-md px-3 py-1.5 text-xs font-bold">
            Ativa
          </span>
        ) : (
          <span className="badge bg-red-100 text-red-500 border-none rounded-md px-3 py-1.5 text-xs font-bold">
            Pausada
          </span>
        )}
      </div>

      {turma.descricao && (
        <p className="text-sm text-azul/70 max-w-2xl">{turma.descricao}</p>
      )}

      {turma.codigo_acesso && (
        <div className="bg-branco rounded-2xl p-5 shadow-sm border border-cinza-claro/10 max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-azul/50 mb-2">
            Código de acesso da turma
          </p>
          <span className="font-mono font-extrabold tracking-widest text-azul text-lg">
            {turma.codigo_acesso}
          </span>
          <p className="text-xs text-azul/45 mt-1">
            Compartilhe esse código com os alunos pra entrarem na turma
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10">
          <h3 className="font-bold text-azul uppercase tracking-wider text-xs mb-4">
            Alunos ({alunos.length})
          </h3>
          {alunos.length === 0 ? (
            <p className="text-sm text-azul/60">
              Nenhum aluno matriculado ainda. Compartilhe o código de acesso acima.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alunos.map((aluno) => (
                <li
                  key={aluno.matricula_id}
                  className="flex items-center gap-3 py-2 border-b border-cinza-claro/20 last:border-0"
                >
                  {aluno.avatar_url && (
                    <img
                      src={`/avatares/${aluno.avatar_url}`}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}
                  <span className="text-sm font-semibold text-azul">
                    {aluno.apelido || aluno.nome_completo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10">
          <h3 className="font-bold text-azul uppercase tracking-wider text-xs mb-4">
            Atividades ({atividades.length})
          </h3>
          {atividades.length === 0 ? (
            <p className="text-sm text-azul/60">
              Nenhuma atividade atribuída a essa turma ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {atividades.map((atividade) => (
                <li
                  key={atividade.id}
                  className="flex items-center justify-between py-2 border-b border-cinza-claro/20 last:border-0"
                >
                  <span className="text-sm font-semibold text-azul">
                    {atividade.titulo}
                  </span>
                  <span
                    className={`badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      atividade.publicado
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {atividade.publicado ? "Publicada" : "Rascunho"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

export default TurmaDetalhe;
