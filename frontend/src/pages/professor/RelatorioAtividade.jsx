import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Indicador, SeloStatus } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { formatarTempo } from "../../utils/tempo";

export function RelatorioAtividade() {
  const { id } = useParams();
  const { dados: relatorio, erro, carregando } = useApi(`/atividade/${id}/relatorio`);

  if (carregando) return <Carregando texto="Carregando relatório..." />;

  if (erro) {
    return (
      <main className="pagina">
        <EstadoVazio>{erro}</EstadoVazio>
      </main>
    );
  }

  const { resumo, alunos, questoes, total_questoes: totalQuestoes } = relatorio;
  const mediaAcertos = resumo.media_acertos_primeira;

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-2">
        <Link to="/professor/atividades" className="text-sm text-azul/60 font-semibold flex items-center gap-1 w-fit">
          <ArrowLeft size={14} /> Atividades
        </Link>
        <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Relatório</h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-azul">{relatorio.titulo}</h2>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Indicador rotulo="Concluíram" valor={`${resumo.alunos_concluiram}/${resumo.alunos_turma}`} />
        <Indicador
          rotulo="Acertos de primeira"
          valor={mediaAcertos == null ? "—" : `${mediaAcertos}/${totalQuestoes}`}
        />
        <Indicador rotulo="Tempo médio" valor={formatarTempo(resumo.media_tempo_seg)} />
        <Indicador rotulo="Reinícios (média)" valor={resumo.media_reinicios ?? "—"} />
      </section>
      <p className="text-xs text-azul/50 -mt-3">
        Médias da primeira vez que cada aluno concluiu a atividade.
      </p>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-azul">Questões que mais erram</h3>
        {questoes.length === 0 ? (
          <EstadoVazio>Essa atividade ainda não tem questões.</EstadoVazio>
        ) : (
          <div className="cartao rounded-2xl divide-y divide-cinza-claro">
            {questoes.map((q) => (
              <div key={q.questao_id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-azul/40">Questão {q.ordem}</span>
                  <p className="text-sm font-semibold text-azul break-words">{q.texto_questao}</p>
                </div>
                {q.respostas === 0 ? (
                  <span className="text-xs text-azul/40">Sem respostas ainda</span>
                ) : (
                  <div className="flex items-center gap-3 sm:w-64 shrink-0">
                    <div className="flex-1 h-2 rounded-full bg-cinza-claro overflow-hidden">
                      <div className="h-full bg-verde" style={{ width: `${q.taxa_acerto_primeira}%` }} />
                    </div>
                    <span className="text-xs font-bold text-azul whitespace-nowrap">
                      {q.taxa_acerto_primeira}% de primeira
                      <span className="text-azul/40 font-medium"> ({q.acertos_primeira}/{q.respostas})</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-azul">Alunos</h3>
        {alunos.length === 0 ? (
          <EstadoVazio>Nenhum aluno matriculado na turma dessa atividade.</EstadoVazio>
        ) : (
          <div className="cartao rounded-2xl overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-azul/40 text-xs uppercase tracking-wider">
                  <th className="p-3 font-bold">Aluno</th>
                  <th className="p-3 font-bold">Situação</th>
                  <th className="p-3 font-bold">Acertos de primeira</th>
                  <th className="p-3 font-bold">Tempo</th>
                  <th className="p-3 font-bold">Reinícios</th>
                  <th className="p-3 font-bold">Partidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinza-claro text-azul">
                {alunos.map((a) => (
                  <tr key={a.aluno_id}>
                    <td className="p-3 font-semibold">
                      <Link to={`/professor/alunos/${a.aluno_id}`} className="hover:text-coral underline-offset-2 hover:underline">
                        {a.nome}
                      </Link>
                    </td>
                    <td className="p-3">
                      <SeloStatus status={a.status} />
                    </td>
                    <td className="p-3">{a.acertos_primeira == null ? "—" : `${a.acertos_primeira}/${totalQuestoes}`}</td>
                    <td className="p-3">{formatarTempo(a.tempo_gasto_seg)}</td>
                    <td className="p-3">{a.reinicios ?? "—"}</td>
                    <td className="p-3">{a.tentativas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default RelatorioAtividade;
