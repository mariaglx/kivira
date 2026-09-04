import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { SearchIcon } from "../../components/icons/search";

export function Turmas() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [listaTurmas, setListaTurmas] = useState([]);

  useEffect(() => {
    async function carregarTurmas() {
      try {
        const response = await apiRequest("/turma/");
        setListaTurmas(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Erro ao carregar turmas:", err.message);
        if (
          err.message?.includes("Token") ||
          err.message?.includes("401") ||
          err.message?.includes("autorização")
        ) {
          localStorage.removeItem("access_token");
          navigate("/login");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarTurmas();
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
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
          <button
            onClick={() => navigate("/professor/turmas/nova")}
            className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-5 py-2 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            + Nova Turma
          </button>
        </header>

        {/* Barra de Pesquisa */}
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/40 text-sm">
             <SearchIcon size={16} isAnimated={false} />
          </span>
          <input
            type="text"
            placeholder="Buscar turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
          />
        </div>

        {/* Grid de Cards */}
        {carregando ? (
          <p className="text-azul/60">Carregando turmas...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {turmasFiltradas.map((turma) => (
              <div
                key={turma.id}
                className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 justify-between relative hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-azul">{turma.nome}</h3>
                    <span className="text-xs text-azul/50 font-medium">
                      {turma.ano_escolar}
                    </span>
                  </div>
                  {turma.ativo ? (
                    <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                      Ativa
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                      Pausada
                    </span>
                  )}
                </div>

                <hr className="border-cinza-claro/30" />

                <div className="flex gap-8">
                  <div>
                    <div className="text-xl font-extrabold text-azul">
                      {turma.alunos_count ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">
                      Alunos
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-azul">
                      {turma.atividades_count ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">
                      Atividades
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => navigate(`/professor/turmas/${turma.id}`)}
                    className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case shadow-sm transition-all active:scale-95"
                  >
                    Ver turma
                  </button>
                  <button
                    onClick={() => navigate(`/professor/turmas/${turma.id}/editar`)}
                    className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case transition-all active:scale-95"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {/* Card Pontilhado "Criar nova turma" */}
            <button
              onClick={() => navigate("/professor/turmas/nova")}
              className="bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
            >
              <span className="text-3xl text-coral font-bold">+</span>
              <span className="text-sm font-bold text-coral/80">
                Criar nova turma
              </span>
            </button>
          </div>
        )}
      </main>
    </>
  );
}