import { useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Input } from "../../components/ui/Input";
import { Lista, Item } from "../../components/ui/Animacao";
import { Indicador } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { subtituloTurma } from "../../utils/turma";
import { ehAdmin } from "../../services/sessao";

const porcento = (valor) => (valor == null ? "—" : `${valor}%`);

function BarraPorcentagem({ valor }) {
  return (
    <div className="flex-1 h-2 rounded-full bg-cinza-claro overflow-hidden">
      <div className="h-full bg-verde" style={{ width: `${valor ?? 0}%` }} />
    </div>
  );
}

function VisaoGeral({ relatorio }) {
  const { resumo, atividades, questoes_dificeis: questoesDificeis } = relatorio;

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Indicador rotulo="Alunos" valor={resumo.alunos} />
        <Indicador rotulo="Atividades" valor={resumo.atividades} />
        <Indicador rotulo="Conclusão" valor={porcento(resumo.taxa_conclusao)} />
        <Indicador rotulo="Acerto de primeira" valor={porcento(resumo.taxa_acerto_primeira)} />
      </section>

      {questoesDificeis.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-bold text-azul">Pontos de atenção</h3>
            <p className="text-xs text-azul/50">As questões que a turma mais errou de primeira — bom ponto de partida pra próxima aula.</p>
          </div>
          <div className="cartao rounded-2xl divide-y divide-cinza-claro">
            {questoesDificeis.map((q) => (
              <Link
                key={`${q.atividade_id}-${q.ordem}`}
                to={`/professor/atividades/${q.atividade_id}/relatorio`}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-bege/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-azul/40">
                    {q.atividade_titulo} · Questão {q.ordem}
                  </span>
                  <p className="text-sm font-semibold text-azul break-words">{q.texto_questao}</p>
                </div>
                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                  <BarraPorcentagem valor={q.taxa_acerto_primeira} />
                  <span className="text-xs font-bold text-azul whitespace-nowrap">{q.taxa_acerto_primeira}% de primeira</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-azul">Atividades</h3>
        {atividades.length === 0 ? (
          <EstadoVazio acao={<Button as={Link} to="/professor/atividades/criar" tamanho="sm">+ Nova atividade</Button>}>
            Essa turma ainda não tem atividades publicadas.
          </EstadoVazio>
        ) : (
          <div className="cartao rounded-2xl divide-y divide-cinza-claro">
            {atividades.map((a) => (
              <Link
                key={a.atividade_id}
                to={`/professor/atividades/${a.atividade_id}/relatorio`}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-bege/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-azul break-words">{a.titulo}</p>
                  <p className="text-xs text-azul/50">{a.disciplina}</p>
                </div>
                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                  <BarraPorcentagem valor={resumo.alunos ? (100 * a.alunos_concluiram) / resumo.alunos : 0} />
                  <span className="text-xs font-bold text-azul whitespace-nowrap">
                    {a.alunos_concluiram}/{resumo.alunos} concluíram
                  </span>
                </div>
                <span className="text-xs font-bold text-azul/70 sm:w-28 shrink-0">
                  {porcento(a.taxa_acerto_primeira)} <span className="font-medium text-azul/40">de primeira</span>
                </span>
                <ChevronRight size={18} className="hidden sm:block text-coral shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function AbaAlunos({ relatorio }) {
  const [busca, setBusca] = useState("");
  const { turma, resumo } = relatorio;
  const termo = busca.trim().toLowerCase();
  const alunos = relatorio.alunos
    .filter((a) => !termo || `${a.apelido ?? ""} ${a.nome_completo} ${a.matricula ?? ""}`.toLowerCase().includes(termo))
    .sort((a, b) => (a.apelido || a.nome_completo).localeCompare(b.apelido || b.nome_completo, "pt-BR"));

  if (relatorio.alunos.length === 0) {
    return (
      <EstadoVazio
        acao={<Button as={Link} to={`/professor/turmas/${turma.id}/editar`} tamanho="sm" variante="contorno">Adicionar alunos</Button>}
      >
        Essa turma ainda não tem alunos. Compartilhe o código {turma.codigo_acesso} ou adicione direto.
      </EstadoVazio>
    );
  }

  return (
    <>
      <div className="w-full max-w-sm">
        <Input
          icone={Search}
          placeholder="Buscar aluno..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="py-2.5 text-sm bg-branco shadow-sm"
        />
      </div>

      {alunos.length === 0 ? (
        <EstadoVazio>Nenhum aluno encontrado com esse nome.</EstadoVazio>
      ) : (
        <Lista className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {alunos.map((a) => (
            <Item key={a.aluno_id} elevar>
              <Link
                to={`/professor/turmas/${turma.id}/alunos/${a.aluno_id}`}
                className="cartao rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
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
                    <p className="text-xs font-bold text-coral">Nível {a.nivel_atual}</p>
                  </div>
                  <ChevronRight size={18} className="text-coral shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cinza-claro">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-azul/40">Concluídas</span>
                    <span className="text-sm font-semibold text-azul">{a.atividades_concluidas}/{resumo.atividades}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-azul/40">Acerto de primeira</span>
                    <span className="text-sm font-semibold text-azul">{porcento(a.taxa_acerto_primeira)}</span>
                  </div>
                </div>
              </Link>
            </Item>
          ))}
        </Lista>
      )}
    </>
  );
}

// Página de uma turma: relatório da turma inteira ("Visão geral") e a aba
// "Alunos", de onde se abre o histórico individual de cada um. As duas abas
// usam a mesma resposta de GET /turma/{id}/relatorio.
export function RelatorioTurma() {
  const { id } = useParams();
  const { dados: relatorio, erro, carregando } = useApi(`/turma/${id}/relatorio`);
  const abaAlunos = useLocation().pathname.endsWith("/alunos");

  if (carregando) return <Carregando texto="Carregando turma..." />;

  if (erro) {
    return (
      <main className="pagina">
        <EstadoVazio>{erro}</EstadoVazio>
      </main>
    );
  }

  const { turma } = relatorio;
  const classeAba = ({ isActive }) =>
    `px-4 min-h-11 flex items-center rounded-full text-sm font-bold whitespace-nowrap transition ${
      isActive ? "bg-coral text-branco shadow-sm" : "bg-branco text-azul/70 hover:text-azul border border-cinza-claro"
    }`;

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-2">
        <Link to="/professor/turmas" className="text-sm text-azul/60 font-semibold flex items-center gap-1 w-fit">
          <ArrowLeft size={14} /> Turmas
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Turma</h1>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-azul">{turma.nome}</h2>
            <p className="text-xs text-azul/50 mt-1">
              {[subtituloTurma(turma), "Código de acesso: "].filter(Boolean).join(" · ")}
              <span className="font-bold text-azul/70 tracking-wider">{turma.codigo_acesso}</span>
            </p>
            {ehAdmin() && turma.professor_nome && (
              <p className="text-xs font-bold text-coral mt-0.5">Prof. {turma.professor_nome}</p>
            )}
          </div>
          <Button as={Link} to={`/professor/turmas/${turma.id}/editar`} tamanho="sm" variante="contorno">
            Editar turma
          </Button>
        </div>
      </header>

      <nav className="flex gap-2" aria-label="Seções da turma">
        <NavLink to={`/professor/turmas/${turma.id}`} end className={classeAba}>
          Visão geral
        </NavLink>
        <NavLink to={`/professor/turmas/${turma.id}/alunos`} className={classeAba}>
          Alunos ({relatorio.resumo.alunos})
        </NavLink>
      </nav>

      {abaAlunos ? <AbaAlunos relatorio={relatorio} /> : <VisaoGeral relatorio={relatorio} />}
    </main>
  );
}

export default RelatorioTurma;
