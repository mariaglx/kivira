import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { apiRequest } from "../../services/api";
import LogoKiviraRosa from "../../components/LogoKiviraRosa";

function Dashboard() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [dados, setDados] = useState({
    professor: { nome: "Professor(a)" },
    metricas: { total_turmas: 0, total_atividades: 0, total_alunos: 0 },
    turmas_recentes: [],
  });

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const response = await apiRequest("/professor/dashboard/resumo");
        setDados(response);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err.message);
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

    carregarDashboard();
  }, [navigate]);

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-bege flex">
      {/* Sidebar Lateral */}
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
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-branco/10 text-branco font-semibold transition"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-coral"></span>
              Dashboard
            </Link>
            <Link
              to="/turmas"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
            >
              Turmas
            </Link>
            <Link
              to="/atividades"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
            >
              Atividades
            </Link>
            <Link
              to="/configuracoes"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-cinza-claro hover:bg-branco/5 hover:text-branco transition font-medium"
            >
              Configurações
            </Link>
          </nav>
        </div>

        {/* Perfil na base do Menu */}
        <div className="pt-4 border-t border-branco/15 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center font-bold text-branco uppercase shadow-sm">
            {dados.professor.nome?.[0] || "P"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-branco">
              {dados.professor.nome}
            </p>
            <Link to="/perfil" className="text-xs text-laranja hover:underline">
              Ver perfil &rarr;
            </Link>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 px-10 py-3 overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mt-5 mb-8">
          <div>
            <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">
              Dashboard
            </h1>
            <h2 className="text-3xl font-extrabold text-azul mt-1">
              Bom dia, {dados.professor.nome}!
            </h2>
            <p className="text-azul/70 text-sm mt-1">
              Veja o resumo das suas turmas e atividades
            </p>
          </div>
          <div className="bg-branco px-4 py-2 rounded-xl border border-cinza-claro text-xs font-semibold text-azul shadow-sm">
            {dataHoje}
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-branco p-6 rounded-2xl shadow-sm border border-cinza-claro">
            <div className="w-10 h-1.5 bg-coral rounded-full mb-3"></div>
            <p className="text-4xl font-extrabold text-azul">
              {carregando ? "..." : dados.metricas.total_turmas}
            </p>
            <p className="text-sm text-azul/70 font-medium mt-1">
              Turmas ativas
            </p>
          </div>

          <div className="bg-branco p-6 rounded-2xl shadow-sm border border-cinza-claro">
            <div className="w-10 h-1.5 bg-azul rounded-full mb-3"></div>
            <p className="text-4xl font-extrabold text-azul">
              {carregando ? "..." : dados.metricas.total_atividades}
            </p>
            <p className="text-sm text-azul/70 font-medium mt-1">
              Atividades criadas
            </p>
          </div>

          <div className="bg-branco p-6 rounded-2xl shadow-sm border border-cinza-claro">
            <div className="w-10 h-1.5 bg-laranja rounded-full mb-3"></div>
            <p className="text-4xl font-extrabold text-azul">
              {carregando ? "..." : dados.metricas.total_alunos}
            </p>
            <p className="text-sm text-azul/70 font-medium mt-1">
              Alunos participantes
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <p className="text-xs font-bold text-azul uppercase tracking-wider mb-4 opacity-80">
            Ações Rápidas
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/turmas/nova")}
              className="bg-coral hover:brightness-95 text-branco font-semibold px-6 py-2.5 rounded-xl shadow-sm"
            >
              + Criar Turma
            </Button>
            <button
              type="button"
              onClick={() => navigate("/atividades/nova")}
              className="bg-branco text-azul border border-azul hover:bg-azul hover:text-branco font-semibold px-6 py-2.5 rounded-xl transition duration-150 shadow-sm"
            >
              + Criar Atividade
            </button>
          </div>
        </div>

        {/* Tabela de Turmas Recentes */}
        <div className="bg-branco rounded-2xl shadow-sm border border-cinza-claro p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-azul uppercase tracking-wider text-xs">
              Turmas Recentes
            </h3>
            <Link
              to="/turmas"
              className="text-sm font-semibold text-coral hover:underline"
            >
              Ver todas &rarr;
            </Link>
          </div>

          {dados.turmas_recentes.length === 0 && !carregando ? (
            <div className="text-center py-10">
              <p className="text-azul/60 text-sm">
                Você ainda não possui turmas cadastradas.
              </p>
              <Button
                onClick={() => navigate("/turmas/nova")}
                className="mt-4 bg-coral text-branco text-xs px-4 py-2 rounded-xl"
              >
                Criar minha primeira turma
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-cinza-claro text-xs text-azul/60 font-bold uppercase tracking-wider">
                    <th className="pb-3">Turma</th>
                    <th className="pb-3">Ano</th>
                    <th className="pb-3">Alunos</th>
                    <th className="pb-3">Atividades</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinza-claro text-sm">
                  {dados.turmas_recentes.map((turma) => (
                    <tr key={turma.id} className="hover:bg-bege/20 transition">
                      <td className="py-4 font-semibold text-azul">
                        {turma.nome}
                      </td>
                      <td className="py-4 text-azul/70">{turma.ano_escolar}</td>
                      <td className="py-4 font-medium text-azul">
                        {turma.alunos_count}
                      </td>
                      <td className="py-4 font-medium text-azul">
                        {turma.atividades_count}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-bold ${
                            turma.status === "Ativa"
                              ? "bg-laranja-claro/40 text-azul border border-laranja"
                              : "bg-cinza-claro text-azul/60"
                          }`}
                        >
                          {turma.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
