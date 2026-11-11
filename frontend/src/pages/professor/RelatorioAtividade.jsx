import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info, Pencil } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Chip, ChipDisciplina, FaixaIndicadores, SeloStatus } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { formatarTempo } from "../../utils/tempo";

const numero = (valor) => (valor == null ? "—" : String(valor).replace(".", ","));

// Frase de erro de uma questão: "1 de 2 errou de primeira" / "ninguém errou".
function fraseErro(q) {
  if (q.respostas === 0) return "sem respostas ainda";
  const erraram = q.respostas - q.acertos_primeira;
  return erraram === 0 ? "ninguém errou" : `${erraram} de ${q.respostas} errou de primeira`;
}

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
  const linkAluno = (a) => `/professor/turmas/${relatorio.turma_id}/alunos/${a.aluno_id}`;

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-2">
        <Link to="/professor/atividades" className="alvo-toque text-sm text-azul/80 font-bold flex items-center gap-1.5 w-fit">
          <ArrowLeft size={16} /> Atividades
        </Link>
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-azul break-words">{relatorio.titulo}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <ChipDisciplina disciplina={relatorio.disciplina} />
              {relatorio.turma_nome && <Chip className="bg-branco text-azul">{relatorio.turma_nome}</Chip>}
              <Chip className="bg-branco text-azul">
                {totalQuestoes} {totalQuestoes === 1 ? "bloco" : "blocos"}
              </Chip>
            </div>
          </div>
          <Button
            as={Link}
            to={`/professor/atividades/${relatorio.atividade_id}/editar`}
            variante="contorno"
            className="gap-2 px-4 min-h-11 font-display font-extrabold"
          >
            <Pencil size={16} /> Editar atividade
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <FaixaIndicadores
          itens={[
            { valor: `${resumo.alunos_concluiram} de ${resumo.alunos_turma}`, rotulo: "concluíram" },
            {
              valor: resumo.media_acertos_primeira == null ? "—" : `${numero(resumo.media_acertos_primeira)} de ${totalQuestoes}`,
              rotulo: "acertos de primeira, em média",
            },
            { valor: formatarTempo(resumo.media_tempo_seg), rotulo: "tempo médio" },
            {
              valor: numero(resumo.media_reinicios),
              rotulo: resumo.media_reinicios != null && resumo.media_reinicios <= 1 ? "reinício por aluno" : "reinícios por aluno",
            },
          ]}
        />
        <p className="text-sm text-azul/80 flex items-center gap-1.5">
          <Info size={15} className="shrink-0" /> Médias contam só a primeira vez que cada aluno concluiu.
        </p>
      </div>

      <section className="cartao rounded-2xl px-4 sm:px-5 py-4">
        <h2 className="font-display font-extrabold text-lg text-azul mb-1">Onde a turma mais erra</h2>
        {questoes.length === 0 ? (
          <p className="text-sm text-azul/80 py-3">Essa atividade ainda não tem questões.</p>
        ) : (
          questoes.map((q) => (
            <div
              key={q.questao_id}
              className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-t border-cinza-claro first-of-type:border-t-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-7 h-7 shrink-0 rounded-full bg-bege font-display font-black text-sm text-azul flex items-center justify-center">
                  {q.ordem}
                </span>
                <span className="font-semibold text-azul break-words">{q.texto_questao}</span>
              </div>
              <div className="flex items-center gap-3 pl-10 sm:pl-0 shrink-0">
                <div className="w-32 sm:w-40 h-2 rounded-full bg-cinza-claro overflow-hidden">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${q.respostas ? (100 * (q.respostas - q.acertos_primeira)) / q.respostas : 0}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-bold whitespace-nowrap sm:w-40 ${
                    q.respostas && q.respostas > q.acertos_primeira ? "text-azul" : "text-azul/80"
                  }`}
                >
                  {fraseErro(q)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-display font-extrabold text-xl text-azul">Alunos</h2>
        {alunos.length === 0 ? (
          <EstadoVazio>Nenhum aluno matriculado na turma dessa atividade.</EstadoVazio>
        ) : (
          <>
            {/* Desktop: tabela; celular: lista de cartões em vez de rolagem lateral */}
            <div className="cartao rounded-2xl overflow-hidden hidden sm:block">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-azul/80 text-xs border-b border-cinza-claro">
                    <th className="px-4 py-2.5 font-bold">Aluno</th>
                    <th className="px-4 py-2.5 font-bold">Situação</th>
                    <th className="px-4 py-2.5 font-bold">De primeira</th>
                    <th className="px-4 py-2.5 font-bold">Tempo</th>
                    <th className="px-4 py-2.5 font-bold">Reinícios</th>
                    <th className="px-4 py-2.5 font-bold">Partidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinza-claro text-azul">
                  {alunos.map((a) => (
                    <tr key={a.aluno_id}>
                      <td className="px-4 py-3 font-bold">
                        <Link to={linkAluno(a)} className="alvo-toque hover:text-coral-texto hover:underline underline-offset-2">
                          {a.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <SeloStatus status={a.status} />
                      </td>
                      <td className={`px-4 py-3 ${a.acertos_primeira == null ? "text-azul/80" : ""}`}>
                        {a.acertos_primeira == null ? "—" : `${a.acertos_primeira}/${totalQuestoes}`}
                      </td>
                      <td className={`px-4 py-3 ${a.tempo_gasto_seg == null ? "text-azul/80" : ""}`}>{formatarTempo(a.tempo_gasto_seg)}</td>
                      <td className={`px-4 py-3 ${a.reinicios == null ? "text-azul/80" : ""}`}>{a.reinicios ?? "—"}</td>
                      <td className="px-4 py-3">{a.tentativas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cartao rounded-2xl overflow-hidden sm:hidden">
              {alunos.map((a) => (
                <Link key={a.aluno_id} to={linkAluno(a)} className="block px-4 py-3 border-t border-cinza-claro first:border-t-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-azul truncate">{a.nome}</span>
                    <SeloStatus status={a.status} />
                  </div>
                  {a.tentativas > 0 && (
                    <p className="text-sm text-azul/80 mt-1">
                      {a.acertos_primeira == null ? "—" : `${a.acertos_primeira}/${totalQuestoes}`} de primeira ·{" "}
                      {formatarTempo(a.tempo_gasto_seg)} · {a.reinicios ?? "—"} reinícios
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default RelatorioAtividade;
