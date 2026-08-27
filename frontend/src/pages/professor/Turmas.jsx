import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { apiRequest } from "../../services/api";
import { LogoKiviraRosa } from "../../components/LogoKiviraRosa";

export function Turmas() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);

  // Armazena a resposta completa da API ou inicia com fallback seguro
  const [dadosTurmas, setDadosTurmas] = useState({
    professor: { nome: "Professor(a)" },
    turmas: [],
  });

  useEffect(() => {
    async function carregarTurmas() {
      try {
        const response = await apiRequest("/professor/turmas");
        // Ajuste conforme o retorno da sua API (se retornar array direto ou objeto com a lista)
        if (Array.isArray(response)) {
          setDadosTurmas((prev) => ({ ...prev, turmas: response }));
        } else {
          setDadosTurmas(response);
        }
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

  // Garantia de que trabalharemos sempre com um Array para evitar crash
  const listaTurmas = Array.isArray(dadosTurmas.turmas) ? dadosTurmas.turmas : [];

  // Filtra as turmas com base no input de pesquisa
  const turmasFiltradas = listaTurmas.filter(
    (turma) =>
      turma.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      turma.materia?.toLowerCase().includes(busca.toLowerCase()) ||
      turma.ano_escolar?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      {/* 1. SIDEBAR */}
      <div className="min-h-screen bg-bege flex">
        <aside className="w-64 bg-azul text-branco flex flex-col justify-between px-6 py-3 shadow-lg">
          <div>
            <div className="flex items-center mb-3 px-1">
              <LogoKiviraRosa className="w-36 h-auto" />
            </div>

            <p className="text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
              Menu
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                to="/professor"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/professor/turmas"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-branco/10 text-branco font-semibold transition"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-coral"></span>
                Turmas
              </Link>
              <Link
                to="/professor/atividades"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
              >
                Atividades
              </Link>
              <Link
                to="/professor/configuracoes"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
              >
                Configurações
              </Link>
            </nav>
          </div>

          {/* Perfil na base do Menu */}
          <div className="pt-4 border-t border-branco/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center font-bold text-branco uppercase shadow-sm">
              {dadosTurmas.professor?.nome?.[0] || "P"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-branco">
                {dadosTurmas.professor?.nome || "Professor(a)"}
              </p>
              <Link
                to="/perfil"
                className="text-xs text-laranja hover:underline"
              >
                Ver perfil &rarr;
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
          <button 
            onClick={() => navigate("/turmas/nova")}
            className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-5 py-2 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          >
            + Nova Turma
          </button>
        </header>

        {/* Barra de Pesquisa */}
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/40 text-sm">
            🔍
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
                      {turma.materia || turma.ano_escolar}
                    </span>
                  </div>
                  {turma.status === "Ativa" ? (
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
                      {turma.alunos_count ?? turma.alunos ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">
                      Alunos
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-azul">
                      {turma.atividades_count ?? turma.atividades ?? 0}
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
                  <button className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case transition-all active:scale-95">
                    Editar
                  </button>
                </div>
              </div>
            ))}

            {/* Card Pontilhado "Criar nova turma" */}
            <button 
              onClick={() => navigate("/turmas/nova")}
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
    </div>
  );
}