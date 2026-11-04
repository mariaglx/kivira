import { useState } from "react";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Entrada } from "../../components/ui/Animacao";
import { Indicador } from "../../components/professor/Relatorio";
import { CartaoGrafico } from "../../components/admin/CartaoGrafico";
import { BarrasEmpilhadas } from "../../components/admin/BarrasEmpilhadas";
import { COR, CORES_ESCALA, PERGUNTA_ABERTA_PROFESSOR, PERGUNTAS_ALUNO, PERGUNTAS_PROFESSOR } from "../../utils/feedback";
import { useApi } from "../../controllers/useApi";

const CHAVE_ANONIMO = "feedback_modo_anonimo";

// As 4 perguntas do professor têm rótulos diferentes, mas todas vão do mais
// negativo (1) ao mais positivo (5): a legenda conjunta fala da escala, e o
// tooltip de cada barra mostra o rótulo daquela pergunta.
const ESCALA_PROFESSOR = ["Muito negativo", "Negativo", "Neutro", "Positivo", "Muito positivo"];

const rotulosAluno = (pergunta) => pergunta.opcoes.map((o) => `${o.rosto} ${o.rotulo}`);

function media(distribuicao) {
  const total = distribuicao.reduce((soma, n) => soma + n, 0);
  return total ? distribuicao.reduce((soma, n, i) => soma + n * (i + 1), 0) / total : null;
}

const decimal = (valor) => (valor == null ? "—" : valor.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }));
const porcento = (parte, total) => (total ? `${Math.round((100 * parte) / total)}%` : "—");
const data = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
// "Turma A", "Turma B"... pro modo anônimo
const letra = (i) => String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26) : "");

function legenda(rotulos, cores) {
  return rotulos.map((rotulo, i) => ({ rotulo: `${i + 1} · ${rotulo}`, cor: cores[i] }));
}

function lerAnonimo() {
  try {
    return localStorage.getItem(CHAVE_ANONIMO) === "1";
  } catch {
    return false;
  }
}

function Indicadores({ grupo, extra }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Indicador rotulo="Respostas" valor={`${grupo.respostas} de ${grupo.total}`} />
      <Indicador rotulo="Taxa de resposta" valor={porcento(grupo.respostas, grupo.total)} />
      {extra}
      <Indicador rotulo="Último envio" valor={data(grupo.ultimo_envio)} />
    </section>
  );
}

function AbaProfessores({ professores, anonimo }) {
  const { distribuicao, comentarios } = professores;
  // Soma as 4 distribuições nota a nota e tira a média de tudo
  const mediaGeral = media(ESCALA_PROFESSOR.map((_, i) => PERGUNTAS_PROFESSOR.reduce((soma, p) => soma + distribuicao[p.campo][i], 0)));

  return (
    <>
      <Indicadores grupo={professores} extra={<Indicador rotulo="Média geral (1 a 5)" valor={decimal(mediaGeral)} />} />

      <CartaoGrafico
        titulo="Professores — distribuição das respostas"
        subtitulo="Escala de 1 a 5. Passe o mouse numa barra pra ver o rótulo daquela pergunta."
        arquivo="feedback-professores-distribuicao"
        legenda={legenda(ESCALA_PROFESSOR, CORES_ESCALA[5])}
      >
        <BarrasEmpilhadas
          nomes={ESCALA_PROFESSOR}
          cores={CORES_ESCALA[5]}
          linhas={PERGUNTAS_PROFESSOR.map((p) => ({
            rotulo: `${p.curto} · ${decimal(media(distribuicao[p.campo]))}`,
            valores: distribuicao[p.campo],
            nomes: p.opcoes,
          }))}
        />
      </CartaoGrafico>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-azul">Comentários ({comentarios.length})</h3>
        <div className="cartao rounded-2xl divide-y divide-cinza-claro">
          {comentarios.map((c, i) => (
            <article key={i} className="p-4 flex flex-col gap-1">
              <p className="text-sm text-azul whitespace-pre-line break-words">{c.texto}</p>
              <p className="text-xs text-azul/50">
                <span className="font-bold text-coral">
                  {anonimo ? `Professor ${comentarios.length - i}` : c.apelido || c.nome_completo || "Professor"}
                </span>
                {!anonimo && c.apelido && c.nome_completo && c.apelido !== c.nome_completo && ` (${c.nome_completo})`}
                {" · "}
                {data(c.data)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AbaAlunos({ alunos, anonimo }) {
  const { distribuicao, por_turma: porTurma } = alunos;
  const [diversao, autonomia, jogarDeNovo] = PERGUNTAS_ALUNO;
  // As duas de 3 pontos dividem o gráfico: "Mais ou menos" e "Talvez" ocupam o mesmo meio
  const escala3 = autonomia.opcoes.map((o, i) =>
    o.rotulo === jogarDeNovo.opcoes[i].rotulo ? `${o.rosto} ${o.rotulo}` : `${o.rosto} ${o.rotulo} / ${jogarDeNovo.opcoes[i].rotulo}`
  );
  const querem = distribuicao.jogar_de_novo;

  return (
    <>
      <Indicadores
        grupo={alunos}
        extra={<Indicador rotulo="Querem jogar de novo" valor={porcento(querem[2], querem.reduce((s, n) => s + n, 0))} />}
      />

      <CartaoGrafico
        titulo={`Alunos — ${diversao.titulo}`}
        arquivo="feedback-alunos-diversao"
        legenda={legenda(rotulosAluno(diversao), CORES_ESCALA[5])}
      >
        <BarrasEmpilhadas
          nomes={rotulosAluno(diversao)}
          cores={CORES_ESCALA[5]}
          linhas={[{ rotulo: `${diversao.curto} · ${decimal(media(distribuicao.diversao))}`, valores: distribuicao.diversao }]}
        />
      </CartaoGrafico>

      <CartaoGrafico
        titulo="Alunos — autonomia e vontade de jogar de novo"
        arquivo="feedback-alunos-autonomia"
        legenda={legenda(escala3, CORES_ESCALA[3])}
      >
        <BarrasEmpilhadas
          nomes={escala3}
          cores={CORES_ESCALA[3]}
          linhas={[autonomia, jogarDeNovo].map((p) => ({
            rotulo: p.curto,
            valores: distribuicao[p.campo],
            nomes: rotulosAluno(p),
          }))}
        />
      </CartaoGrafico>

      {porTurma.length > 0 && (
        <CartaoGrafico
          titulo="Alunos — taxa de resposta por turma"
          arquivo="feedback-alunos-por-turma"
          legenda={[
            { rotulo: "Responderam", cor: COR.verde },
            { rotulo: "Ainda não responderam", cor: COR.neutro },
          ]}
        >
          <BarrasEmpilhadas
            nomes={["Responderam", "Ainda não responderam"]}
            cores={[COR.verde, COR.neutro]}
            linhas={porTurma.map((t, i) => ({
              rotulo: anonimo ? `Turma ${letra(i)}` : t.turma,
              valores: [t.respostas, t.total - t.respostas],
            }))}
          />
        </CartaoGrafico>
      )}
    </>
  );
}

// Só leitura: os textos vêm de utils/feedback.js, os mesmos que os formulários
// usam — mudar uma pergunta é mudar lá (e o git guarda o histórico).
function AbaPerguntas() {
  const publicos = [
    { titulo: "Professores", perguntas: PERGUNTAS_PROFESSOR, aberta: PERGUNTA_ABERTA_PROFESSOR },
    { titulo: "Alunos", perguntas: PERGUNTAS_ALUNO },
  ];

  return publicos.map(({ titulo, perguntas, aberta }) => (
    <section key={titulo} className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-azul">
        {titulo} <span className="text-sm font-semibold text-azul/50">({perguntas.length + (aberta ? 1 : 0)} perguntas)</span>
      </h3>
      <div className="cartao rounded-2xl divide-y divide-cinza-claro">
        {perguntas.map((p, i) => {
          const opcoes = p.opcoes.map((o) => (typeof o === "string" ? o : `${o.rosto} ${o.rotulo}`));
          return (
            <article key={p.campo} className="p-4 flex flex-col gap-2">
              <div>
                <span className="text-xs font-bold text-azul/40">
                  {i + 1} · {p.curto} · escala de 1 a {opcoes.length}
                </span>
                <p className="font-bold text-azul">{p.titulo}</p>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {opcoes.map((rotulo, n) => (
                  <li key={n} className="flex items-center gap-1.5 text-xs font-semibold text-azul/70">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: CORES_ESCALA[opcoes.length][n] }} />
                    {n + 1} · {rotulo}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {aberta && (
          <article className="p-4">
            <span className="text-xs font-bold text-azul/40">{perguntas.length + 1} · Comentário · texto livre</span>
            <p className="font-bold text-azul">{aberta}</p>
          </article>
        )}
      </div>
    </section>
  ));
}

// Dashboard dos questionários de feedback (só admin — GET /feedback/resumo).
// O modo anônimo troca nomes de professores e turmas por rótulos genéricos,
// pra tela e os PNGs irem direto pro artigo.
export function ResultadosFeedback() {
  const { dados, erro, carregando } = useApi("/feedback/resumo");
  const [aba, setAba] = useState("professores");
  const [anonimo, setAnonimoEstado] = useState(lerAnonimo);

  function setAnonimo(valor) {
    setAnonimoEstado(valor);
    try {
      localStorage.setItem(CHAVE_ANONIMO, valor ? "1" : "0");
    } catch {
      // sem storage (aba anônima etc.): o modo só não fica lembrado
    }
  }

  if (carregando) return <Carregando texto="Carregando feedbacks..." />;

  if (erro) {
    return (
      <main className="pagina">
        <EstadoVazio>{erro}</EstadoVazio>
      </main>
    );
  }

  const grupo = dados[aba];
  const classeAba = (ativa) =>
    `px-4 min-h-11 flex items-center rounded-full text-sm font-bold whitespace-nowrap transition ${
      ativa ? "bg-coral text-branco shadow-sm" : "bg-branco text-azul/70 hover:text-azul border border-cinza-claro"
    }`;

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Feedback</h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-azul">Resultados dos questionários</h2>
        </div>
        <label className="flex items-center gap-2 bg-branco px-4 min-h-11 rounded-xl border border-cinza-claro shadow-sm text-sm font-bold text-azul cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-sm checked:bg-coral checked:border-coral"
            checked={anonimo}
            onChange={(e) => setAnonimo(e.target.checked)}
          />
          Modo anônimo
        </label>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Seções do feedback">
        <button type="button" className={classeAba(aba === "professores")} aria-pressed={aba === "professores"} onClick={() => setAba("professores")}>
          Professores ({dados.professores.respostas})
        </button>
        <button type="button" className={classeAba(aba === "alunos")} aria-pressed={aba === "alunos"} onClick={() => setAba("alunos")}>
          Alunos ({dados.alunos.respostas})
        </button>
        <button type="button" className={classeAba(aba === "perguntas")} aria-pressed={aba === "perguntas"} onClick={() => setAba("perguntas")}>
          Perguntas
        </button>
      </nav>

      {aba === "perguntas" ? (
        <Entrada key={aba} className="flex flex-col gap-6 lg:gap-8">
          <AbaPerguntas />
        </Entrada>
      ) : grupo.respostas === 0 ? (
        <EstadoVazio>Ninguém respondeu ainda.</EstadoVazio>
      ) : (
        <Entrada key={aba} className="flex flex-col gap-6 lg:gap-8">
          {aba === "professores" ? (
            <AbaProfessores professores={grupo} anonimo={anonimo} />
          ) : (
            <AbaAlunos alunos={grupo} anonimo={anonimo} />
          )}
        </Entrada>
      )}
    </main>
  );
}

export default ResultadosFeedback;
