import { useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, Flag, Plus, Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Input } from "../../components/ui/Input";
import { Lista, Item } from "../../components/ui/Animacao";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { BarraSegmentos, Chip, ChipDisciplina, CodigoCopiavel, Filtro, TileDisciplina } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { subtituloTurma } from "../../utils/turma";
import { ehAdmin } from "../../services/sessao";

const porcento = (valor) => (valor == null ? "—" : `${valor}%`);
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// Anel de conclusão (SVG): verde sobre cinza, valor no meio.
function AnelConclusao({ valor }) {
  const circunferencia = 2 * Math.PI * 15.5;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" role="img" aria-label={`${valor ?? 0}% de conclusão`}>
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-cinza-claro" strokeWidth="4" />
        {valor > 0 && (
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className="stroke-verde"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(circunferencia * valor) / 100} ${circunferencia}`}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-black text-2xl text-azul">
        {valor ?? 0}%
      </span>
    </div>
  );
}

function VisaoGeral({ relatorio }) {
  const { turma, resumo, atividades, alunos, questoes_dificeis: questoesDificeis } = relatorio;
  const entregas = atividades.reduce((soma, a) => soma + a.alunos_concluiram, 0);
  const semConclusao = resumo.alunos ? atividades.filter((a) => a.alunos_concluiram === 0) : [];
  const parados = atividades.length ? alunos.filter((a) => !a.comecou).length : 0;
  const avisos = [
    semConclusao.length === 1 && `Ninguém concluiu "${semConclusao[0].titulo}" ainda.`,
    semConclusao.length > 1 && `${semConclusao.length} atividades ainda sem nenhuma conclusão.`,
    parados === 1 && "1 aluno não começou nenhuma atividade.",
    parados > 1 && `${parados} alunos não começaram nenhuma atividade.`,
  ].filter(Boolean);

  return (
    <>
      <section className="cartao rounded-2xl px-5 sm:px-6 py-5 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <AnelConclusao valor={resumo.taxa_conclusao} />
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-lg text-azul">Conclusão da turma</h3>
            <p className="text-sm text-azul/80">
              {entregas} de {plural(resumo.alunos * resumo.atividades, "entrega feita", "entregas feitas")}, somando{" "}
              {resumo.atividades === 1 ? "a 1 atividade" : `as ${resumo.atividades} atividades`} para{" "}
              {resumo.alunos === 1 ? "o 1 aluno" : `os ${resumo.alunos} alunos`}.
            </p>
          </div>
        </div>
        <div className="flex gap-7 md:border-l border-cinza-claro md:pl-6">
          {[
            [resumo.alunos, resumo.alunos === 1 ? "aluno" : "alunos"],
            [resumo.atividades, resumo.atividades === 1 ? "atividade" : "atividades"],
            [porcento(resumo.taxa_acerto_primeira), "acerto de 1ª"],
          ].map(([valor, rotulo]) => (
            <div key={rotulo}>
              <p className={`font-display font-black text-2xl ${valor === "—" ? "text-azul/80" : "text-azul"}`}>{valor}</p>
              <p className="text-sm font-bold text-azul/80">{rotulo}</p>
            </div>
          ))}
        </div>
      </section>

      {avisos.length > 0 && (
        <section className="rounded-2xl bg-pessego-bg px-4 sm:px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3.5">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-laranja text-azul-escuro flex items-center justify-center">
            <Flag size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-extrabold text-pessego-fg">Precisa de atenção</h3>
            <p className="text-sm text-pessego-fg">{avisos.join(" ")}</p>
          </div>
          {parados > 0 && (
            <Link
              to={`/professor/turmas/${turma.id}/alunos`}
              className="alvo-toque font-display font-extrabold text-sm text-pessego-fg flex items-center gap-1 hover:underline"
            >
              Ver alunos <ArrowRight size={16} />
            </Link>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h3 className="font-display font-extrabold text-xl text-azul">
          Atividades <span className="text-base text-azul/80">{atividades.length}</span>
        </h3>
        {atividades.length === 0 ? (
          <EstadoVazio
            acao={
              <Button as={Link} to="/professor/atividades/criar" state={{ turmaIdPadrao: turma.id }} tamanho="sm" className="gap-1.5">
                <Plus size={14} /> Nova atividade
              </Button>
            }
          >
            Essa turma ainda não tem atividades publicadas.
          </EstadoVazio>
        ) : (
          <div className="cartao rounded-2xl overflow-hidden">
            {atividades.map((a) => (
              <Link
                key={a.atividade_id}
                to={`/professor/atividades/${a.atividade_id}/relatorio`}
                className="px-4 sm:px-5 py-4 flex items-center gap-4 border-t border-cinza-claro first:border-t-0 hover:bg-bege/30 transition-colors"
              >
                <TileDisciplina
                  disciplina={a.disciplina}
                  imagem={a.imagem_atividade_url}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl"
                  tamanhoIcone={26}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-[17px] text-azul break-words">{a.titulo}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <ChipDisciplina disciplina={a.disciplina} />
                    <Chip>{plural(a.total_questoes, "bloco", "blocos")}</Chip>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                  <BarraSegmentos valor={a.alunos_concluiram} max={resumo.alunos} />
                  {a.taxa_acerto_primeira == null ? (
                    <span className="text-sm font-extrabold text-coral-texto">Ninguém começou</span>
                  ) : (
                    <span className="text-sm font-extrabold text-azul">
                      {a.alunos_concluiram}/{resumo.alunos} concluíram
                    </span>
                  )}
                </div>
                <ChevronRight size={20} className="text-coral-texto shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {questoesDificeis.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div>
            <h3 className="font-display font-extrabold text-xl text-azul">Onde a turma mais erra</h3>
            <p className="text-sm text-azul/80">
              As questões que a turma mais errou de primeira, bom ponto de partida pra próxima aula.
            </p>
          </div>
          <div className="cartao rounded-2xl overflow-hidden">
            {questoesDificeis.map((q) => {
              const erraram = Math.round((q.respostas * (100 - q.taxa_acerto_primeira)) / 100);
              return (
                <Link
                  key={`${q.atividade_id}-${q.ordem}`}
                  to={`/professor/atividades/${q.atividade_id}/relatorio`}
                  className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-t border-cinza-claro first:border-t-0 hover:bg-bege/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-azul/80">
                      {q.atividade_titulo} · Questão {q.ordem}
                    </span>
                    <p className="text-sm font-semibold text-azul break-words">{q.texto_questao}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-64 shrink-0">
                    <div className="flex-1 h-2 rounded-full bg-cinza-claro overflow-hidden">
                      <div className="h-full rounded-full bg-coral" style={{ width: `${100 - q.taxa_acerto_primeira}%` }} />
                    </div>
                    <span className="text-xs font-bold text-azul whitespace-nowrap">
                      {erraram} de {q.respostas} errou de primeira
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function AbaAlunos({ relatorio }) {
  const [busca, setBusca] = useState("");
  const [soPendentes, setSoPendentes] = useState(false);
  const { turma, resumo } = relatorio;
  const termo = busca.trim().toLowerCase();
  // Professor só vê SE o aluno respondeu o feedback, pra poder cobrar — as respostas são só do admin
  const responderam = relatorio.alunos.filter((a) => a.respondeu_feedback).length;
  const alunos = relatorio.alunos
    .filter((a) => !soPendentes || !a.respondeu_feedback)
    .filter((a) => !termo || `${a.apelido ?? ""} ${a.nome_completo} ${a.matricula ?? ""}`.toLowerCase().includes(termo))
    .sort((a, b) => (a.apelido || a.nome_completo).localeCompare(b.apelido || b.nome_completo, "pt-BR"));

  if (relatorio.alunos.length === 0) {
    return (
      <EstadoVazio
        acao={
          <Button as={Link} to={`/professor/turmas/${turma.id}/editar`} tamanho="sm">
            Adicionar alunos
          </Button>
        }
      >
        Essa turma ainda não tem alunos. Compartilhe o código {turma.codigo_acesso} ou adicione direto.
      </EstadoVazio>
    );
  }

  return (
    <>
      <div className="cartao rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-sm text-azul">
          <span className="font-extrabold">
            {responderam} de {relatorio.alunos.length}
          </span>{" "}
          alunos responderam o feedback
        </p>
        <BarraProgresso valor={responderam} max={relatorio.alunos.length} preenchimento="bg-verde" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            icone={Search}
            aria-label="Buscar aluno"
            placeholder="Buscar aluno"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="py-2.5 text-sm bg-branco"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtrar pelo feedback">
          <Filtro ativo={!soPendentes} onClick={() => setSoPendentes(false)}>
            Todos
          </Filtro>
          <Filtro ativo={soPendentes} onClick={() => setSoPendentes(true)}>
            Feedback pendente ({relatorio.alunos.length - responderam})
          </Filtro>
        </div>
      </div>

      {alunos.length === 0 ? (
        <EstadoVazio>
          {soPendentes && !termo ? "Todos os alunos já responderam o feedback." : "Nenhum aluno encontrado com esse nome."}
        </EstadoVazio>
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
                      <p className="text-xs text-azul/80 truncate">{a.nome_completo}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-xs font-bold text-coral-texto">Nível {a.nivel_atual}</p>
                      <Chip className={a.respondeu_feedback ? "bg-cie-bg text-cie-fg-escuro" : "bg-por-bg text-coral-texto"}>
                        {a.respondeu_feedback ? "Feedback enviado" : "Feedback pendente"}
                      </Chip>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-coral-texto shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cinza-claro">
                  <div>
                    <span className="block rotulo">Concluídas</span>
                    <span className="text-sm font-semibold text-azul">
                      {a.atividades_concluidas}/{resumo.atividades}
                    </span>
                  </div>
                  <div>
                    <span className="block rotulo">Acerto de primeira</span>
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

const classeAba = ({ isActive }) =>
  `px-4 min-h-11 flex items-center rounded-full text-sm font-bold whitespace-nowrap transition ${
    isActive ? "bg-coral text-azul-escuro" : "bg-branco text-azul border border-cinza-claro hover:border-coral"
  }`;

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

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-2">
        <Link to="/professor/turmas" className="alvo-toque text-sm text-azul/80 font-bold flex items-center gap-1.5 w-fit">
          <ArrowLeft size={16} /> Turmas
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-azul break-words">{turma.nome}</h1>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {subtituloTurma(turma) && (
                <Chip className="bg-branco border border-cinza-claro text-azul">{subtituloTurma(turma)}</Chip>
              )}
              <CodigoCopiavel codigo={turma.codigo_acesso} />
            </div>
            {ehAdmin() && turma.professor_nome && (
              <p className="text-xs font-bold text-coral-texto mt-1.5">Prof. {turma.professor_nome}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              as={Link}
              to={`/professor/turmas/${turma.id}/editar`}
              variante="contorno"
              className="px-4 min-h-11 font-display font-extrabold"
            >
              Editar turma
            </Button>
            <Button
              as={Link}
              to="/professor/atividades/criar"
              state={{ turmaIdPadrao: turma.id }}
              className="gap-2 px-4 min-h-11 font-display font-extrabold"
            >
              <Plus size={18} /> Nova atividade
            </Button>
          </div>
        </div>
      </header>

      <nav className="flex gap-2" aria-label="Seções da turma">
        <NavLink to={`/professor/turmas/${turma.id}`} end className={classeAba}>
          Visão geral
        </NavLink>
        <NavLink to={`/professor/turmas/${turma.id}/alunos`} className={classeAba}>
          Alunos · {relatorio.resumo.alunos}
        </NavLink>
      </nav>

      {abaAlunos ? <AbaAlunos relatorio={relatorio} /> : <VisaoGeral relatorio={relatorio} />}
    </main>
  );
}

export default RelatorioTurma;
