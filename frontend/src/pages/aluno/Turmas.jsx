import { Link, Navigate, useOutletContext } from "react-router-dom";
import { useTurmasAluno } from "../../controllers/useTurmasAluno";
import { Users } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Carregando } from "../../components/ui/Carregando";
import { Lista, Item } from "../../components/ui/Animacao";

export function Turmas() {
  const { carregandoAluno } = useOutletContext();
  const { turmas, carregando } = useTurmasAluno();

  if (carregandoAluno || carregando) {
    return <Carregando />;
  }

  // Só uma turma: pula a lista e abre o ranking dela direto. Com mais de uma,
  // a aba "Minha Turma" mostra essa lista pra escolher (ver TurmaDetalhe.jsx
  // pro "← Turmas" de volta pra cá).
  if (turmas.length === 1) {
    return <Navigate to={`/aluno/turmas/${turmas[0].id}`} replace />;
  }

  return (
    <>
      <main className="pagina pb-16">
        <h1 className="text-2xl sm:text-3xl font-black mb-6 flex items-center gap-2">
          Suas turmas
          <Users size={26} />
        </h1>

        {turmas.length === 0 ? (
          <div className="cartao p-6 sm:p-10 text-center">
            <p className="text-azul/70 font-semibold text-lg">
              Você ainda não está em nenhuma turma. Peça o código pro seu
              professor!
            </p>
          </div>
        ) : (
          <Lista className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turmas.map((turma) => (
              <Item key={turma.id} elevar className="flex">
              <Link
                to={`/aluno/turmas/${turma.id}`}
                className="cartao flex-1 p-5 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="text-lg font-extrabold">{turma.nome}</h3>
                  <span className="text-xs text-azul/50 font-medium">
                    {turma.ano_escolar} · {turma.ano_letivo}
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-bege/60 rounded-2xl p-3 mt-auto">
                  <Avatar
                    arquivo={turma.professor_avatar_url}
                    nome={turma.professor_nome || "P"}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-azul/50">
                      Professor(a)
                    </p>
                    <p className="text-sm font-semibold truncate">
                      {turma.professor_nome || "—"}
                    </p>
                  </div>
                </div>
              </Link>
              </Item>
            ))}
          </Lista>
        )}
      </main>
    </>
  );
}

export default Turmas;
