import { Link, useOutletContext } from "react-router-dom";
import { useTurmaAluno } from "../../controllers/useTurmaAluno";
import { useTurmasAluno } from "../../controllers/useTurmasAluno";
import { Avatar } from "../../components/ui/Avatar";
import { Carregando } from "../../components/ui/Carregando";
import { Lista, Item } from "../../components/ui/Animacao";

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
  const { carregandoAluno } = useOutletContext();
  const { turma, erro, carregando } = useTurmaAluno();
  // Com 1 turma só, /aluno/turmas redireciona pra cá direto (ver Turmas.jsx)
  // — mostrar "← Turmas" nesse caso só devolveria o aluno pro mesmo lugar.
  const { turmas: minhasTurmas } = useTurmasAluno();

  if (carregandoAluno || carregando) {
    return <Carregando />;
  }

  // Ninguém tem XP enquanto as partidas não forem gravadas — nesse caso a lista
  // sai em ordem alfabética (é o que o backend devolve) e sem posições
  const temXp = turma?.colegas?.some((c) => c.xp_total > 0);

  return (
    <>
      <main className="pagina flex flex-col gap-6">
        {minhasTurmas.length > 1 && (
          <header className="flex items-center gap-3">
            <Link
              to="/aluno/turmas"
              className="text-azul/50 hover:text-azul text-sm font-bold"
            >
              ← Turmas
            </Link>
          </header>
        )}

        {erro ? (
          <div className="cartao p-6 sm:p-10 text-center max-w-md">
            <p className="text-azul/70 font-semibold text-lg">{erro}</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Turma: {turma.nome}
            </h2>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
              {/* COLUNA ESQUERDA — dados da turma */}
              <div className="w-full lg:max-w-sm bg-branco rounded-2xl p-5 sm:p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 shrink-0">
                <Campo rotulo="Nome da turma">{turma.nome}</Campo>
                <Campo rotulo="Ano escolar">
                  {turma.ano_escolar} · {turma.ano_letivo}
                </Campo>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Professor(a)
                  </label>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40">
                    <Avatar
                      arquivo={turma.professor_avatar_url}
                      nome={turma.professor_nome}
                      className="w-9 h-9 text-sm rounded-xl"
                    />
                    <span className="text-sm font-semibold truncate">
                      {turma.professor_nome || "—"}
                    </span>
                  </div>
                </div>

                <Campo rotulo="Código de acesso">
                  <span className="font-mono font-extrabold tracking-widest">
                    {turma.codigo_acesso}
                  </span>
                </Campo>
              </div>

              {/* COLUNA DIREITA — os colegas */}
              <div className="flex-1 min-w-0 bg-branco rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-laranja/20 px-4 sm:px-6 py-3.5">
                  <h3 className="font-bold text-azul uppercase tracking-wider text-xs">
                    Colegas de turma ({turma.colegas.length})
                  </h3>
                </div>

                <Lista className="px-3 sm:px-6 py-2">
                  {turma.colegas.map((colega, indice) => (
                    <Item
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

                      <Avatar arquivo={colega.avatar_url} nome={colega.nome} className="w-9 h-9 text-sm rounded-xl" />

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
                    </Item>
                  ))}
                </Lista>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default TurmaDetalhe;
