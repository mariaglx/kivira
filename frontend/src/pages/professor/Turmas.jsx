import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flag, Plus, Search, UsersRound } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Lista, Item } from "../../components/ui/Animacao";
import { BarraConclusao, CodigoCopiavel, Filtro } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { subtituloTurma } from "../../utils/turma";
import { ehAdmin } from "../../services/sessao";

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function CartaoTurma({ turma }) {
  const conclusao = turma.total_entregas ? Math.round((100 * turma.entregas) / turma.total_entregas) : 0;
  return (
    // O card inteiro abre a turma pelo "link esticado" do Abrir turma (::after
    // cobrindo o card); o Copiar fica por cima com z-10 — botão dentro de <a> não vale.
    <div className="cartao relative flex-1 rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className={`px-5 py-4 flex flex-wrap justify-between items-start gap-3 ${turma.ativo ? "bg-azul" : "bg-azul/70"}`}>
        <div className="min-w-0">
          <h2 className="font-display font-black text-xl text-branco break-words">{turma.nome}</h2>
          <p className="text-sm text-branco/85">{subtituloTurma(turma)}</p>
          {ehAdmin() && turma.professor_nome && (
            <p className="text-xs text-laranja-claro font-bold mt-0.5">Prof. {turma.professor_nome}</p>
          )}
        </div>
        <CodigoCopiavel codigo={turma.codigo_acesso} className="relative z-10 bg-branco/15 text-branco [&_button]:text-laranja-claro" />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3.5 flex-1">
        <div className="flex items-center gap-3">
          {turma.avatares?.length > 0 && (
            <div className="flex pl-2">
              {turma.avatares.map((a, i) => (
                <Avatar
                  key={i}
                  arquivo={a.avatar_url}
                  nome={a.nome}
                  className="w-7 h-7 rounded-full -ml-2 ring-2 ring-branco text-[11px]"
                />
              ))}
            </div>
          )}
          <span className="text-sm font-bold text-azul">
            {plural(turma.alunos_count, "aluno", "alunos")} · {plural(turma.atividades_count, "atividade", "atividades")}
          </span>
        </div>
        <div>
          <div className="flex justify-between text-sm font-bold text-azul mb-1.5">
            <span>Conclusão</span>
            <span>{conclusao}%</span>
          </div>
          <BarraConclusao valor={turma.entregas} max={turma.total_entregas} />
        </div>
        <div className="mt-auto pt-3 border-t border-cinza-claro flex justify-between items-center gap-3">
          {turma.alunos_parados > 0 ? (
            <span className="text-sm font-display font-extrabold text-pessego-fg flex items-center gap-1.5">
              <Flag size={15} /> {plural(turma.alunos_parados, "aluno parado", "alunos parados")}
            </span>
          ) : (
            <span />
          )}
          <Link
            to={`/professor/turmas/${turma.id}`}
            className="text-sm font-display font-extrabold text-coral-texto flex items-center gap-1 after:absolute after:inset-0 after:content-['']"
          >
            Abrir turma <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Turmas() {
  const [busca, setBusca] = useState("");
  const [verAtivas, setVerAtivas] = useState(true);
  const { dados, carregando } = useApi("/turma/");

  const lista = dados ?? [];
  const ativas = lista.filter((t) => t.ativo).length;
  const termo = busca.trim().toLowerCase();
  const turmasFiltradas = lista
    .filter((t) => Boolean(t.ativo) === verAtivas)
    .filter((t) => !termo || t.nome?.toLowerCase().includes(termo) || t.ano_escolar?.toLowerCase().includes(termo));

  return (
    <main className="pagina flex flex-col gap-5 lg:gap-6">
      <header className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-azul">Turmas</h1>
          <p className="text-sm text-azul/80">
            {plural(ativas, "ativa", "ativas")} · {plural(lista.length - ativas, "desativada", "desativadas")}
          </p>
        </div>
        <Button as={Link} to="/professor/turmas/nova" className="gap-2 px-4 min-h-11 font-display font-extrabold">
          <Plus size={18} /> Nova turma
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm">
          <Input
            icone={Search}
            placeholder="Buscar turma"
            aria-label="Buscar turma"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="py-2.5 text-sm bg-branco"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtrar turmas">
          <Filtro ativo={verAtivas} onClick={() => setVerAtivas(true)}>Ativas</Filtro>
          <Filtro ativo={!verAtivas} onClick={() => setVerAtivas(false)}>Desativadas</Filtro>
        </div>
      </div>

      {carregando ? (
        <Carregando embutido texto="Carregando turmas..." />
      ) : (
        <Lista className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {turmasFiltradas.map((turma) => (
            <Item key={turma.id} elevar className="flex">
              <CartaoTurma turma={turma} />
            </Item>
          ))}

          {verAtivas ? (
            <Item elevar className="flex">
              <Link
                to="/professor/turmas/nova"
                className="flex-1 border-2 border-dashed border-coral/60 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-1.5 text-center hover:bg-branco/50 transition-colors"
              >
                <UsersRound size={28} className="text-coral-texto" />
                <span className="font-display font-extrabold text-coral-texto">
                  {lista.length ? "Criar outra turma" : "Criar sua primeira turma"}
                </span>
                <span className="text-sm text-azul/80">Você recebe um código pra passar aos alunos</span>
              </Link>
            </Item>
          ) : (
            turmasFiltradas.length === 0 && (
              <EstadoVazio className="md:col-span-2 xl:col-span-3">
                {termo ? "Nenhuma turma desativada com esse nome." : "Nenhuma turma desativada."}
              </EstadoVazio>
            )
          )}
        </Lista>
      )}
    </main>
  );
}
export default Turmas;
