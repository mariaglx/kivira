import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { ehAdmin } from "../../services/sessao";
import { useVerComo } from "../../controllers/useVerComo";
import { Avatar } from "../../components/ui/Avatar";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Chip, FaixaIndicadores, Filtro, MenuMais, SeloStatus, TileDisciplina } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { formatarTempo } from "../../utils/tempo";
import { nomeDisciplina } from "../../utils/disciplina";
import { progressoNivel } from "../../utils/xp";
import { Alerta } from "../../components/ui/Alerta";

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : null;
}

// "Não terminou" junta quem abandonou e quem ainda está no meio da partida.
const FILTROS = [
  ["todas", "Todas", () => true],
  ["concluido", "Concluiu", (a) => a.status === "concluido"],
  ["incompleto", "Não terminou", (a) => a.status === "abandonado" || a.status === "em_andamento"],
  ["nao_iniciado", "Não começou", (a) => a.status === "nao_iniciado"],
];

function Metricas({ atividade: a }) {
  const itens = [
    [a.acertos_primeira == null ? "—" : `${a.acertos_primeira}/${a.total_questoes}`, "de primeira"],
    [formatarTempo(a.tempo_gasto_seg), "tempo"],
    [a.reinicios ?? "—", "reinícios"],
    [a.tentativas, "partidas"],
  ];
  return (
    <dl className="grid grid-cols-4 gap-x-4 sm:gap-x-5 text-right shrink-0">
      {itens.map(([valor, rotulo]) => (
        <div key={rotulo} className="flex flex-col-reverse">
          <dt className="text-xs text-azul/80">{rotulo}</dt>
          <dd className="font-display font-black text-base text-azul whitespace-nowrap">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RelatorioAluno() {
  const { id: turmaId, alunoId } = useParams();
  const [filtro, setFiltro] = useState("todas");
  const { verComo, abrindo, erro: erroVerComo } = useVerComo();
  const { dados: relatorio, erro, carregando } = useApi(`/aluno/${alunoId}/relatorio`);

  const nomeTurma = relatorio?.aluno.turmas.length === 1 ? relatorio.aluno.turmas[0] : "Turma";
  const voltar = (
    <Link to={`/professor/turmas/${turmaId}`} className="alvo-toque text-sm text-azul/80 font-bold flex items-center gap-1.5 w-fit">
      <ArrowLeft size={16} /> {relatorio ? nomeTurma : "Turma"}
    </Link>
  );

  if (carregando) return <Carregando texto="Carregando histórico..." />;

  if (erro) {
    return (
      <main className="pagina flex flex-col gap-4">
        {voltar}
        <EstadoVazio>{erro}</EstadoVazio>
      </main>
    );
  }

  const { aluno, resumo, atividades } = relatorio;
  const nome = aluno.apelido || aluno.nome_completo;
  const progresso = progressoNivel(aluno.xp_total);
  const filtrar = FILTROS.find(([chave]) => chave === filtro)[2];
  const visiveis = atividades.filter(filtrar);
  const identificacao = [
    aluno.apelido && aluno.apelido !== aluno.nome_completo ? aluno.nome_completo : null,
    aluno.matricula ? `matrícula ${aluno.matricula}` : null,
    aluno.turmas.join(", "),
  ].filter(Boolean);

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      {voltar}

      <header className="cartao rounded-2xl p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
          <Avatar
            arquivo={aluno.avatar_url}
            nome={nome}
            className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl text-3xl ring-[3px] ring-laranja ring-offset-2"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-black text-azul truncate">{nome}</h1>
            <p className="text-sm text-azul/80 break-words">{identificacao.join(" · ")}</p>
          </div>
          {ehAdmin() && (
            <MenuMais
              rotulo="Mais ações"
              itens={[
                {
                  rotulo: abrindo === `aluno:${aluno.id}` ? "Abrindo..." : "Ver como aluno",
                  Icone: Eye,
                  onClick: () => verComo("aluno", aluno.id),
                },
              ]}
            />
          )}
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <div className="flex justify-between items-baseline">
            <span className="font-display font-black text-xl text-azul">Nível {progresso.nivel}</span>
            <span className="text-sm font-bold text-azul/80">{aluno.xp_total} XP</span>
          </div>
          <div className="h-2 rounded-full bg-cinza-claro overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full bg-laranja"
              style={{ width: `${(100 * progresso.xpNoNivel) / progresso.xpDoNivel}%` }}
            />
          </div>
          <p className="text-xs text-azul/80 mt-1">
            {progresso.xpDoNivel - progresso.xpNoNivel} XP pro nível {progresso.nivel + 1}
          </p>
        </div>
      </header>

      {erroVerComo && <Alerta>{erroVerComo}</Alerta>}

      <FaixaIndicadores
        itens={[
          { valor: `${resumo.atividades_concluidas} de ${resumo.atividades_total}`, rotulo: resumo.atividades_total === 1 ? "atividade concluída" : "atividades concluídas" },
          { valor: resumo.taxa_acerto_primeira == null ? "—" : `${resumo.taxa_acerto_primeira}%`, rotulo: "acerto de primeira" },
          { valor: formatarTempo(resumo.tempo_total_seg), rotulo: "jogando" },
        ]}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display font-extrabold text-xl text-azul flex-1 min-w-40">Atividades</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            {FILTROS.map(([chave, rotulo]) => (
              <Filtro key={chave} ativo={filtro === chave} onClick={() => setFiltro(chave)}>
                {rotulo}
              </Filtro>
            ))}
          </div>
        </div>
        {atividades.length === 0 ? (
          <EstadoVazio>Nenhuma atividade publicada nas turmas desse aluno.</EstadoVazio>
        ) : visiveis.length === 0 ? (
          <EstadoVazio>Nenhuma atividade nessa situação.</EstadoVazio>
        ) : (
          <div className="cartao rounded-2xl overflow-hidden">
            {visiveis.map((a) => (
              <div
                key={a.atividade_id}
                className="px-4 sm:px-5 py-4 flex flex-col md:flex-row md:items-start gap-3 md:gap-4 border-t border-cinza-claro first:border-t-0"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <TileDisciplina disciplina={a.disciplina} imagem={a.imagem_atividade_url} className="w-11 h-11 rounded-2xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-extrabold text-base text-azul break-words">{a.titulo}</h3>
                      <SeloStatus status={a.status} />
                    </div>
                    <p className="text-sm text-azul/80">
                      {[nomeDisciplina(a.disciplina), aluno.turmas.length > 1 ? a.turma_nome : null, formatarData(a.ultima_vez)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.questoes_erradas.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs font-bold text-coral-texto">Errou de primeira:</span>
                        {a.questoes_erradas.map((q) => (
                          <Chip key={q.ordem} className="bg-por-bg text-coral-texto max-w-full">
                            <span className="truncate">Q{q.ordem} · {q.texto_questao}</span>
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {a.tentativas > 0 && <Metricas atividade={a} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default RelatorioAluno;
