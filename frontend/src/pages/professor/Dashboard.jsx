import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, MessageSquareText, PartyPopper, Pencil, Plus, UserX } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Carregando } from "../../components/ui/Carregando";
import { BarraConclusao } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";

function saudacao(agora = new Date()) {
  const hora = agora.getHours();
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

const porcento = (feitas, total) => (total ? Math.round((100 * feitas) / total) : 0);

// "3º ano" vira "3º" no quadrado da turma; sem número, a inicial do nome.
function siglaTurma(turma) {
  return turma.ano_escolar?.match(/\d+\s*º?/)?.[0].replace(/\s/g, "") || turma.nome.charAt(0).toUpperCase();
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// Ações do "Pra hoje": rascunho por publicar, aluno parado, feedback pendente.
function montarPraHoje(turmas, atividades) {
  const itens = [];
  const rascunhos = atividades.filter((a) => !a.publicado);
  if (rascunhos.length === 1) {
    const [r] = rascunhos;
    itens.push({
      chave: "rascunho",
      Icone: Pencil,
      cor: "bg-pessego-bg text-pessego-fg",
      titulo: `${r.titulo} está em rascunho`,
      detalhe: `${plural(r.total_questoes ?? 0, "questão pronta", "questões prontas")}, falta publicar`,
      link: { to: `/professor/atividades/${r.id}/editar`, rotulo: "Abrir" },
    });
  } else if (rascunhos.length > 1) {
    itens.push({
      chave: "rascunho",
      Icone: Pencil,
      cor: "bg-pessego-bg text-pessego-fg",
      titulo: `${rascunhos.length} atividades em rascunho`,
      detalhe: "Faltam publicar pra turma jogar",
      link: { to: "/professor/atividades", rotulo: "Ver" },
    });
  }
  for (const t of turmas) {
    if (t.alunos_parados > 0) {
      itens.push({
        chave: `parados-${t.id}`,
        Icone: UserX,
        cor: "bg-por-bg text-coral-texto",
        titulo: t.alunos_parados === 1 ? "1 aluno não começou nenhuma atividade" : `${t.alunos_parados} alunos não começaram nenhuma atividade`,
        detalhe: t.nome,
        link: { to: `/professor/turmas/${t.id}/alunos`, rotulo: "Ver" },
      });
    }
  }
  for (const t of turmas) {
    if (t.alunos_count > 0 && t.feedback_respondido < t.alunos_count) {
      itens.push({
        chave: `feedback-${t.id}`,
        Icone: MessageSquareText,
        cor: "bg-cie-bg text-cie-fg-escuro",
        titulo: `${t.feedback_respondido} de ${plural(t.alunos_count, "aluno mandou", "alunos mandaram")} feedback`,
        detalhe: t.nome,
        link: { to: `/professor/turmas/${t.id}/alunos`, rotulo: "Ver" },
      });
    }
  }
  return itens;
}

function LinhaPraHoje({ item }) {
  const { Icone, cor, titulo, detalhe, link } = item;
  return (
    <div className="flex items-center gap-3 py-3 border-t border-cinza-claro first:border-t-0">
      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${cor}`}>
        <Icone size={19} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-azul break-words">{titulo}</p>
        <p className="text-sm text-azul/80 truncate">{detalhe}</p>
      </div>
      {link && (
        <Link to={link.to} className="alvo-toque shrink-0 font-display font-extrabold text-sm text-coral-texto flex items-center gap-1 hover:underline">
          {link.rotulo} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function Dashboard() {
  const { dados: resumo } = useApi("/professor/dashboard/resumo?incluir_turmas_recentes=false");
  const { dados: listaTurmas, carregando } = useApi("/turma/");
  const { dados: listaAtividades } = useApi("/atividade/professor/minhas");

  if (carregando) return <Carregando texto="Carregando seu painel..." />;

  const turmas = (listaTurmas ?? []).filter((t) => t.ativo).sort((a, b) => b.id - a.id);
  const atividades = listaAtividades ?? [];
  const praHoje = montarPraHoje(turmas, atividades);
  const entregas = turmas.reduce((soma, t) => soma + (t.entregas ?? 0), 0);
  const totalEntregas = turmas.reduce((soma, t) => soma + (t.total_entregas ?? 0), 0);
  const metricas = resumo?.metricas;

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <p className="text-sm font-bold text-azul/80 first-letter:uppercase">{hoje}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-azul">
            {saudacao()}, {resumo?.professor?.nome ?? "Professor(a)"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button as={Link} to="/professor/turmas/nova" variante="contorno" className="gap-2 px-4 min-h-11 font-display font-extrabold">
            <Plus size={18} /> Turma
          </Button>
          <Button as={Link} to="/professor/atividades/criar" className="gap-2 px-4 min-h-11 font-display font-extrabold">
            <Plus size={18} /> Nova atividade
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <section className="cartao rounded-2xl px-5 py-4">
          <h2 className="font-display font-extrabold text-lg text-azul mb-1">Pra hoje</h2>
          {praHoje.length === 0 ? (
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-cie-bg text-cie-fg-escuro">
                <PartyPopper size={19} />
              </div>
              <p className="font-bold text-azul">Tudo em dia por aqui.</p>
            </div>
          ) : (
            praHoje.map((item) => <LinhaPraHoje key={item.chave} item={item} />)
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl bg-azul text-branco px-5 py-4">
            <p className="text-sm font-bold text-branco/85">Conclusão geral</p>
            <p className="font-display font-black text-4xl leading-tight">{porcento(entregas, totalEntregas)}%</p>
            <div className="h-2 rounded-full bg-branco/20 overflow-hidden mt-1">
              <div className="h-full rounded-full bg-laranja" style={{ width: `${porcento(entregas, totalEntregas)}%` }} />
            </div>
            <p className="text-sm text-branco/85 mt-2">
              {entregas} de {plural(totalEntregas, "entrega", "entregas")}
            </p>
          </section>
          <section className="cartao rounded-2xl px-4 py-4 flex justify-around text-center">
            {[
              [metricas?.total_turmas_ativas, "turma", "turmas"],
              [metricas?.total_atividades, "atividade", "atividades"],
              [metricas?.total_alunos, "aluno", "alunos"],
            ].map(([valor, um, varios]) => (
              <div key={varios}>
                <p className="font-display font-black text-2xl text-azul">{valor ?? "—"}</p>
                <p className="text-sm font-bold text-azul/80">{valor === 1 ? um : varios}</p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className="cartao rounded-2xl px-5 py-4">
        <div className="flex justify-between items-center gap-3 mb-1">
          <h2 className="font-display font-extrabold text-lg text-azul">Suas turmas</h2>
          <Link to="/professor/turmas" className="alvo-toque font-display font-extrabold text-sm text-coral-texto flex items-center gap-1 hover:underline">
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>
        {turmas.length === 0 ? (
          <EstadoVazio
            className="border-0 shadow-none"
            acao={
              <Button as={Link} to="/professor/turmas/nova" tamanho="sm">
                Criar minha primeira turma
              </Button>
            }
          >
            Você ainda não tem turmas ativas.
          </EstadoVazio>
        ) : (
          turmas.slice(0, 5).map((t) => (
            <Link
              key={t.id}
              to={`/professor/turmas/${t.id}`}
              className="flex items-center gap-3 py-3 border-t border-cinza-claro first-of-type:border-t-0 hover:bg-bege/30 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-laranja text-azul-escuro font-display font-black text-sm flex items-center justify-center">
                {siglaTurma(t)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-azul truncate">{t.nome}</p>
                <p className="text-sm text-azul/80">
                  {plural(t.alunos_count, "aluno", "alunos")} · {plural(t.atividades_count, "atividade", "atividades")}
                </p>
              </div>
              <BarraConclusao valor={t.entregas} max={t.total_entregas} className="hidden sm:block w-36" />
              <span className="text-sm font-bold text-azul w-10 text-right">{porcento(t.entregas, t.total_entregas)}%</span>
              <ChevronRight size={18} className="text-coral-texto shrink-0" />
            </Link>
          ))
        )}
      </section>
    </main>
  );
}

export default Dashboard;
