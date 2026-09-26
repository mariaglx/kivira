import { Link } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useTurmaAluno } from "../../controllers/useTurmaAluno";
import { StarIcon } from "../../components/icons/star";

function Avatar({ arquivo, nome, tamanho = "w-9 h-9", texto = "text-sm" }) {
  if (arquivo) {
    return (
      <img
        src={`/avatares/${arquivo}`}
        alt=""
        className={`${tamanho} rounded-xl object-cover bg-bege shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${tamanho} ${texto} rounded-xl bg-coral text-branco font-extrabold uppercase flex items-center justify-center shrink-0`}
    >
      {(nome || "?").charAt(0)}
    </div>
  );
}

function Campo({ rotulo, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
        {rotulo}
      </label>
      <div className="px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 text-sm text-azul font-semibold">
        {children}
      </div>
    </div>
  );
}

export function TurmaDetalhe() {
  const { aluno, turma, erro, carregando, sair } = useTurmaAluno();

  if (carregando) {
    return (
      <div className="min-h-screen bg-bege flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  // Ninguém tem XP enquanto as partidas não forem gravadas — nesse caso a lista
  // sai em ordem alfabética (é o que o backend devolve) e sem posições
  const temXp = turma?.colegas?.some((c) => c.xp_total > 0);

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar aluno={aluno} onSair={sair} />

      <main className="flex-1 min-w-0 p-8 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link
            to="/aluno/turmas"
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            ← Turmas
          </Link>
        </header>

        {erro ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30 max-w-md">
            <p className="text-azul/70 font-semibold text-lg">{erro}</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight">
              Turma: {turma.nome}
            </h2>

            <div className="flex gap-6 items-start flex-wrap">
              {/* COLUNA ESQUERDA — dados da turma */}
              <div className="w-full max-w-sm bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 shrink-0">
                <Campo rotulo="Nome da turma">{turma.nome}</Campo>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Professor(a)
                  </label>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40">
                    <Avatar
                      arquivo={turma.professor_avatar_url}
                      nome={turma.professor_nome}
                    />
                    <span className="text-sm font-semibold truncate">
                      {turma.professor_nome || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA — ranking dos colegas */}
              <div className="flex-1 min-w-80 bg-branco rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 bg-ouro-bg px-6 py-3.5">
                  <StarIcon size={16} isAnimated={false} className="text-ouro-fg-escuro" />
                  <h3 className="font-display font-bold text-ouro-fg-escuro tracking-wide text-sm">
                    Ranking da turma
                  </h3>
                </div>

                <div className="px-6 py-2">
                  {turma.colegas.map((colega, indice) => (
                    <div
                      key={colega.aluno_id}
                      className={`flex items-center gap-3 py-2.5 border-b border-cinza-claro last:border-0 ${
                        colega.sou_eu ? "bg-coral/10 rounded-xl px-2 ring-2 ring-coral/30" : ""
                      }`}
                    >
                      {temXp && indice < 3 ? (
                        <span className="w-6.5 shrink-0 text-xl text-center" title={`${indice + 1}º lugar`}>
                          {["🥇", "🥈", "🥉"][indice]}
                        </span>
                      ) : temXp ? (
                        <span className="w-6.5 shrink-0 text-[15px] font-extrabold text-center text-azul/35">
                          {indice + 1}
                        </span>
                      ) : (
                        <span className="w-6.5 shrink-0 text-[15px] font-extrabold text-azul/25 text-center">
                          –
                        </span>
                      )}

                      <Avatar arquivo={colega.avatar_url} nome={colega.nome} />

                      <span className="text-sm font-semibold grow min-w-0 truncate">
                        {colega.nome}
                      </span>

                      {colega.sou_eu && (
                        <span className="text-[11px] font-bold text-coral bg-coral/15 rounded-md px-2 py-0.5 shrink-0">
                          você
                        </span>
                      )}

                      <span
                        className={`text-[13px] font-extrabold shrink-0 ${
                          temXp ? "text-coral" : "text-azul/30"
                        }`}
                      >
                        {colega.xp_total} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default TurmaDetalhe;
