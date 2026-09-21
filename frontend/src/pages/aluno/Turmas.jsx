import { Link } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { useTurmasAluno } from "../../controllers/useTurmasAluno";
import { UsersIcon } from "../../components/icons/users";
import { ClipboardListIcon } from "../../components/icons/clipboard-list";

// Variedade visual entre cards — não tem significado (turma não é disciplina),
// só evita que uma grade de turmas vire uma fileira de caixas bege idênticas.
// Mesma paleta por "bucket" já usada nos cards de atividade (19/09).
const CORES_TURMA = [
  { capa: "bg-mat-bg", blob: "bg-mat-fg", icone: "text-mat-fg" },
  { capa: "bg-cie-bg", blob: "bg-cie-fg", icone: "text-cie-fg" },
  { capa: "bg-por-bg", blob: "bg-por-fg", icone: "text-por-fg" },
  { capa: "bg-ouro-bg", blob: "bg-ouro-fg", icone: "text-ouro-fg" },
];

function CardTurma({ turma, cor }) {
  return (
    <Link
      to={`/aluno/turmas/${turma.id}`}
      className="bg-branco rounded-3xl shadow-sm border border-cinza-claro/20 flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className={`relative h-23 flex items-center px-5 overflow-hidden ${cor.capa}`}>
        <span className={`absolute w-21 h-21 rounded-full opacity-50 -right-6 -top-7 ${cor.blob}`} />
        <span className={`absolute w-13 h-13 rounded-full opacity-50 right-8 -bottom-6 ${cor.blob}`} />
        <span className="relative w-13 h-13 rounded-2xl bg-branco shadow-md flex items-center justify-center shrink-0">
          <UsersIcon size={26} isAnimated={false} className={cor.icone} />
        </span>
      </div>

      <div className="p-5 flex flex-col gap-3.5 flex-1">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">{turma.nome}</h3>
          <span className="text-xs text-azul/50 font-semibold">
            {turma.ano_escolar} · {turma.ano_letivo}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-azul/60 bg-bege px-2.5 py-1 rounded-full">
            <UsersIcon size={13} isAnimated={false} />
            {turma.total_colegas} {turma.total_colegas === 1 ? "colega" : "colegas"}
          </span>
          {turma.atividades_pendentes > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-ouro-fg-escuro bg-ouro-bg px-2.5 py-1 rounded-full">
              <ClipboardListIcon size={13} />
              {turma.atividades_pendentes} {turma.atividades_pendentes === 1 ? "atividade nova" : "atividades novas"}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3.5 border-t border-dashed border-cinza-claro flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco text-xs uppercase shrink-0">
            {turma.professor_avatar_url ? (
              <img
                src={`/avatares/${turma.professor_avatar_url}`}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (turma.professor_nome || "P").charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-azul/50">
              Professor(a)
            </p>
            <p className="text-[13.5px] font-bold truncate">{turma.professor_nome || "—"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Turmas() {
  const { aluno, turmas, carregando, sair } = useTurmasAluno();

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

      <main className="flex-1 min-w-0 px-10 py-10 pb-16">
        <div className="mb-9">
          <h1 className="font-display text-[34px] font-bold leading-tight">Suas turmas</h1>
          <p className="text-azul/50 font-medium mt-1">As turmas em que você está matriculado.</p>
        </div>

        {turmas.length === 0 ? (
          <div className="bg-branco rounded-3xl p-10 text-center shadow-sm border border-cinza-claro/30">
            <p className="text-azul/70 font-semibold text-lg">
              Você ainda não está em nenhuma turma. Peça o código pro seu professor!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma, indice) => (
              <CardTurma key={turma.id} turma={turma} cor={CORES_TURMA[indice % CORES_TURMA.length]} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Turmas;
