import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { ChevronRight, Search } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Carregando } from "../../components/ui/Carregando";
import { Lista, Item } from "../../components/ui/Animacao";
import { subtituloTurma } from "../../utils/turma";

export function Turmas() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [listaTurmas, setListaTurmas] = useState([]);

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    async function carregarTurmas() {
      try {
        const response = await apiRequest("/turma/", { signal: controller.signal });
        if (!cancelado) setListaTurmas(Array.isArray(response) ? response : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar turmas:", err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarTurmas();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [navigate]);

  // Filtra as turmas com base no input de pesquisa
  const turmasFiltradas = listaTurmas.filter(
    (turma) =>
      turma.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      turma.ano_escolar?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      {/* 2. ÁREA PRINCIPAL */}
      <main className="pagina flex flex-col gap-6 lg:gap-8">
        <header className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
          <Button onClick={() => navigate("/professor/turmas/nova")} className="px-5 py-2 text-sm">
            + Nova Turma
          </Button>
        </header>

        {/* Barra de Pesquisa */}
        <div className="w-full max-w-sm">
          <Input
            icone={Search}
            placeholder="Buscar turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="py-2.5 text-sm bg-branco shadow-sm"
          />
        </div>

        {/* Grid de Cards */}
        {carregando ? (
          <Carregando embutido texto="Carregando turmas..." />
        ) : (
          <Lista className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {turmasFiltradas.map((turma) => (
              <Item key={turma.id} elevar className="flex">
                <Link
                  to={`/professor/turmas/${turma.id}`}
                  className="cartao flex-1 rounded-2xl p-6 flex flex-col gap-5 justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-azul break-words">{turma.nome}</h3>
                      <span className="text-xs text-azul/50 font-medium">{subtituloTurma(turma)}</span>
                    </div>
                    {turma.ativo ? (
                      <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                        Ativa
                      </span>
                    ) : (
                      <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                        Inativa
                      </span>
                    )}
                  </div>

                  <hr className="border-cinza-claro/30" />

                  <div className="flex items-end gap-8">
                    <div>
                      <div className="text-xl font-extrabold text-azul">{turma.alunos_count ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">Alunos</div>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-azul">{turma.atividades_count ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">Atividades</div>
                    </div>
                    <span className="ml-auto text-sm font-bold text-coral flex items-center gap-1">
                      Abrir <ChevronRight size={16} />
                    </span>
                  </div>
                </Link>
              </Item>
            ))}

            {/* Card Pontilhado "Criar nova turma" */}
            <Item
              as="button"
              elevar
              onClick={() => navigate("/professor/turmas/nova")}
              className="bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="text-3xl text-coral font-bold">+</span>
              <span className="text-sm font-bold text-coral/80">
                Criar nova turma
              </span>
            </Item>
          </Lista>
        )}
      </main>

    </>
  );
}
export default Turmas;
