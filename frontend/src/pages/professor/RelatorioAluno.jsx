import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { BarraProgresso } from "../../components/ui/BarraProgresso";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Lista, Item } from "../../components/ui/Animacao";
import { Indicador, SeloStatus } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { formatarTempo } from "../../utils/tempo";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : null;
}

function Metrica({ rotulo, valor }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wider text-azul/40">{rotulo}</span>
      <span className="text-sm font-semibold text-azul">{valor}</span>
    </div>
  );
}

export function RelatorioAluno() {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const { dados: relatorio, erro, carregando } = useApi(`/aluno/${alunoId}/relatorio`);

  const voltar = (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="text-sm text-azul/60 font-semibold flex items-center gap-1 w-fit"
    >
      <ArrowLeft size={14} /> Voltar
    </button>
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

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      {voltar}

      <header className="cartao rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <Avatar
          arquivo={aluno.avatar_url}
          nome={nome}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-3xl ring-4 ring-laranja"
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-azul truncate">{nome}</h1>
          {aluno.apelido && aluno.apelido !== aluno.nome_completo && (
            <p className="text-sm text-azul/60 truncate">{aluno.nome_completo}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {aluno.matricula && (
              <span className="text-[10px] font-bold text-azul/50 bg-cinza-claro px-2 py-0.5 rounded-md">
                {aluno.matricula}
              </span>
            )}
            {aluno.turmas.map((turma) => (
              <span key={turma} className="text-[10px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded-md">
                {turma}
              </span>
            ))}
          </div>
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <p className="text-sm font-bold text-coral mb-1.5">Nível {aluno.nivel_atual}</p>
          <BarraProgresso valor={xpNoNivel(aluno.xp_total)} max={XP_POR_NIVEL} />
          <p className="text-xs text-azul/60 font-semibold mt-1">{aluno.xp_total} XP no total</p>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Indicador rotulo="Atividades concluídas" valor={`${resumo.atividades_concluidas}/${resumo.atividades_total}`} />
        <Indicador
          rotulo="Acerto de primeira"
          valor={resumo.taxa_acerto_primeira == null ? "—" : `${resumo.taxa_acerto_primeira}%`}
        />
        <Indicador rotulo="Tempo jogando" valor={formatarTempo(resumo.tempo_total_seg)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-azul">Atividades</h2>
        {atividades.length === 0 ? (
          <EstadoVazio>Nenhuma atividade publicada nas turmas desse aluno.</EstadoVazio>
        ) : (
          <Lista className="flex flex-col gap-3">
            {atividades.map((a) => (
              <Item key={a.atividade_id} className="cartao rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-azul break-words">{a.titulo}</h3>
                    <p className="text-xs text-azul/50 font-medium">
                      {[a.disciplina, a.turma_nome, formatarData(a.ultima_vez)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <SeloStatus status={a.status} />
                </div>

                {a.tentativas > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Metrica
                      rotulo="Acertos de primeira"
                      valor={a.acertos_primeira == null ? "—" : `${a.acertos_primeira}/${a.total_questoes}`}
                    />
                    <Metrica rotulo="Tempo" valor={formatarTempo(a.tempo_gasto_seg)} />
                    <Metrica rotulo="Reinícios" valor={a.reinicios ?? "—"} />
                    <Metrica rotulo="Partidas" valor={a.tentativas} />
                  </div>
                )}

                {a.questoes_erradas.length > 0 && (
                  <div className="bg-bege/40 border border-bege rounded-xl p-3 flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-red-500">Errou de primeira</span>
                    {a.questoes_erradas.map((q) => (
                      <p key={q.ordem} className="text-sm text-azul break-words">
                        <span className="font-bold text-azul/40 mr-1.5">{q.ordem}.</span>
                        {q.texto_questao}
                      </p>
                    ))}
                  </div>
                )}
              </Item>
            ))}
          </Lista>
        )}
      </section>
    </main>
  );
}

export default RelatorioAluno;
