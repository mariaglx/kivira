import { useState } from "react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Input } from "../../components/ui/Input";
import { Lista, Item } from "../../components/ui/Animacao";
import { useApi } from "../../controllers/useApi";

// Alunos do professor separados por turma: uma aba por turma (as mesmas que
// aparecem aninhadas embaixo de "Alunos" no menu). Sem turma na URL, vai pra primeira.
export function Alunos() {
  const { turmaId } = useParams();
  const [busca, setBusca] = useState("");
  const { dados: turmas, erro: erroTurmas, carregando: carregandoTurmas } = useApi("/turma/");

  const turmaAtual = turmas?.find((t) => String(t.id) === turmaId) ?? turmas?.[0];
  const { dados: matriculas, erro: erroAlunos, carregando: carregandoAlunos } = useApi(
    turmaAtual ? `/aluno_turma/turma/${turmaAtual.id}` : null,
  );

  if (carregandoTurmas) return <Carregando texto="Carregando turmas..." />;
  if (!turmaId && turmaAtual) return <Navigate to={`/professor/alunos/turma/${turmaAtual.id}`} replace />;

  const termo = busca.trim().toLowerCase();
  const alunos = (matriculas ?? [])
    .filter((m) => m.ativo)
    .filter((m) => !termo || `${m.apelido ?? ""} ${m.nome_completo} ${m.matricula ?? ""}`.toLowerCase().includes(termo))
    .sort((a, b) => (a.apelido || a.nome_completo).localeCompare(b.apelido || b.nome_completo, "pt-BR"));

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header>
        <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Alunos</h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-azul mt-1">Seus alunos, por turma</h2>
        <p className="text-azul/70 text-sm mt-1">Toque em um aluno pra ver o histórico completo dele</p>
      </header>

      {erroTurmas ? (
        <EstadoVazio>{erroTurmas}</EstadoVazio>
      ) : turmas.length === 0 ? (
        <EstadoVazio acao={<Button as={Link} to="/professor/turmas/nova" tamanho="sm">+ Nova turma</Button>}>
          Você ainda não tem turmas. Crie uma pra começar a adicionar alunos.
        </EstadoVazio>
      ) : (
        <>
          <nav className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" aria-label="Turmas">
            {turmas.map((t) => (
              <NavLink
                key={t.id}
                to={`/professor/alunos/turma/${t.id}`}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition min-h-11 flex items-center gap-2 ${
                  t.id === turmaAtual.id ? "bg-coral text-branco shadow-sm" : "bg-branco text-azul/70 hover:text-azul border border-cinza-claro"
                }`}
              >
                {t.nome}
                <span className={`text-xs ${t.id === turmaAtual.id ? "text-branco/80" : "text-azul/40"}`}>{t.alunos_count}</span>
              </NavLink>
            ))}
          </nav>

          <div className="w-full max-w-sm">
            <Input
              icone={Search}
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="py-2.5 text-sm bg-branco shadow-sm"
            />
          </div>

          {carregandoAlunos ? (
            <Carregando embutido texto="Carregando alunos..." />
          ) : erroAlunos ? (
            <EstadoVazio>{erroAlunos}</EstadoVazio>
          ) : alunos.length === 0 ? (
            <EstadoVazio
              acao={!termo && (
                <Button as={Link} to={`/professor/turmas/${turmaAtual.id}/editar`} tamanho="sm" variante="contorno">
                  Adicionar alunos
                </Button>
              )}
            >
              {termo ? "Nenhum aluno encontrado com esse nome." : "Essa turma ainda não tem alunos."}
            </EstadoVazio>
          ) : (
            <Lista key={turmaAtual.id} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {alunos.map((a) => (
                <Item key={a.matricula_id} elevar>
                  <Link
                    to={`/professor/alunos/${a.aluno_id}`}
                    className="cartao rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <Avatar
                      arquivo={a.avatar_url}
                      nome={a.apelido || a.nome_completo}
                      className="w-14 h-14 rounded-2xl text-xl ring-2 ring-laranja-claro"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-azul truncate">{a.apelido || a.nome_completo}</p>
                      {a.apelido && a.apelido !== a.nome_completo && (
                        <p className="text-xs text-azul/50 truncate">{a.nome_completo}</p>
                      )}
                      {a.matricula && (
                        <span className="text-[10px] font-bold text-azul/40 bg-cinza-claro px-1.5 py-0.5 rounded mt-1 inline-block">
                          {a.matricula}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-coral shrink-0" />
                  </Link>
                </Item>
              ))}
            </Lista>
          )}
        </>
      )}
    </main>
  );
}

export default Alunos;
