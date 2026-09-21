import { Sidebar } from "../../components/aluno/Sidebar";
import { useHistoricoAluno } from "../../controllers/useHistoricoAluno";
import { identificarDisciplina } from "../../utils/disciplina";
import { ChevronDownIcon } from "../../components/icons/chevron-down";

// "Hoje, 14:32" / "Ontem, 23:17" / "17/09, 09:03" — mais fácil de ler rápido
// numa lista do que uma data por extenso em cada linha.
function formatarData(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const mesmodia = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (mesmodia(data, hoje)) return `Hoje, ${hora}`;
  if (mesmodia(data, ontem)) return `Ontem, ${hora}`;
  return `${data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}

// "42s" / "1min05s"
function formatarTempo(segundos) {
  if (segundos == null) return null;
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const seg = String(segundos % 60).padStart(2, "0");
  return `${min}min${seg}s`;
}

function Tentativa({ tentativa, totalQuestoes, ehMelhor }) {
  const corrigiu = totalQuestoes - tentativa.acertos_primeira;
  const tempo = formatarTempo(tentativa.tempo_gasto_seg);

  return (
    <div className="flex items-center gap-3.5 py-2.5 border-t border-cinza-claro first:border-t-0">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ehMelhor ? "bg-ouro-fg" : "bg-cinza-claro"}`} />
      <span className="text-[13px] font-bold text-azul w-28 shrink-0">{formatarData(tentativa.data)}</span>
      <span className="flex-1 text-xs text-azul/50 font-semibold">
        <b className="text-azul font-bold">
          {tentativa.acertos_primeira}/{totalQuestoes}
        </b>{" "}
        na 1ª tentativa{corrigiu > 0 ? ` (corrigiu ${corrigiu})` : ""}
        {tempo ? ` · ${tempo}` : ""}
      </span>
      <span className="font-display text-sm font-bold text-ouro-fg-escuro shrink-0">
        +{tentativa.xp_ganho} XP
      </span>
    </div>
  );
}

function CardAtividade({ atividade, aberto, onAlternar }) {
  const { Icon, bg, fg } = identificarDisciplina(atividade.disciplina);

  return (
    <div className="bg-branco rounded-3xl shadow-sm border border-cinza-claro/20 overflow-hidden">
      <button
        type="button"
        onClick={onAlternar}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={`w-13 h-13 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon size={24} isAnimated={false} className={fg} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-[16px] leading-tight truncate">
            {atividade.atividade_titulo}
          </h3>
          <p className="text-xs text-azul/50 font-semibold mt-0.5 truncate">
            {atividade.disciplina}
            {atividade.turma_nome ? ` · ${atividade.turma_nome} · ` : " · "}
            jogada {atividade.vezes_jogada}x
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-base font-bold text-ouro-fg-escuro">
            +{atividade.xp_total_ganho}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-azul/40">XP total</p>
        </div>

        <div
          className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            aberto ? "bg-por-bg" : "bg-bege"
          }`}
        >
          <ChevronDownIcon
            size={15}
            isAnimated={false}
            className={`${aberto ? "text-por-fg-escuro rotate-180" : "text-azul/40"} transition-transform`}
          />
        </div>
      </button>

      {aberto && (
        <div className="px-4 pb-3 border-t border-dashed border-cinza-claro mx-4">
          {atividade.tentativas.map((tentativa) => (
            <Tentativa
              key={tentativa.sessao_id}
              tentativa={tentativa}
              totalQuestoes={atividade.total_questoes}
              ehMelhor={tentativa.acertos_primeira === atividade.melhor_acertos_primeira}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Historico() {
  const {
    aluno,
    atividades,
    turmasDisponiveis,
    turmaSelecionada,
    setTurmaSelecionada,
    expandidas,
    alternarExpandida,
    carregando,
    sair,
  } = useHistoricoAluno();

  if (carregando) {
    return (
      <div className="min-h-screen bg-bege flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar aluno={aluno} onSair={sair} />

      <main className="flex-1 min-w-0 px-10 py-10 pb-16 max-w-3xl">
        <div className="mb-7">
          <h1 className="font-display text-[34px] font-bold leading-tight">Seu histórico</h1>
          <p className="text-azul/50 font-medium mt-1">
            Tudo que você já jogou, agrupado por atividade.
          </p>
        </div>

        {atividades.length === 0 && turmasDisponiveis.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
            <p className="text-azul/70 font-semibold text-lg">
              Ainda não dá pra ver as partidas antigas.
            </p>
            <p className="text-azul/55 mt-2">
              Quando você jogar, o Kivira vai guardar aqui os seus acertos e a sua pontuação.
            </p>
          </div>
        ) : (
          <>
            {turmasDisponiveis.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <button
                  type="button"
                  onClick={() => setTurmaSelecionada(null)}
                  className={`font-display text-sm font-bold px-4 py-2 rounded-full border transition-colors ${
                    turmaSelecionada === null
                      ? "bg-azul text-branco border-azul"
                      : "bg-branco text-azul/60 border-cinza-claro"
                  }`}
                >
                  Todas as turmas
                </button>
                {turmasDisponiveis.map((turma) => (
                  <button
                    key={turma.id}
                    type="button"
                    onClick={() => setTurmaSelecionada(turma.id)}
                    className={`font-display text-sm font-bold px-4 py-2 rounded-full border transition-colors ${
                      turmaSelecionada === turma.id
                        ? "bg-azul text-branco border-azul"
                        : "bg-branco text-azul/60 border-cinza-claro"
                    }`}
                  >
                    {turma.nome}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {atividades.map((atividade) => (
                <CardAtividade
                  key={atividade.atividade_id}
                  atividade={atividade}
                  aberto={expandidas.has(atividade.atividade_id)}
                  onAlternar={() => alternarExpandida(atividade.atividade_id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Historico;
