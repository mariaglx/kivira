import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogoKiviraRosa } from "../LogoKiviraRosa";
import { House, Users, Blocks, Settings } from "lucide-react";
import { apiRequest } from "../../services/api";
import { limparSessao } from "../../services/sessao";

// Descobre a aba ativa a partir da própria URL, ao invés de exigir que cada
// página lembre de passar `ativo` — assim o Sidebar pode viver no layout
// (montado uma única vez) sem nenhuma página precisar saber dele.
function detectarAtivo(pathname) {
  if (pathname.startsWith("/professor/turmas")) return "turmas";
  if (pathname.startsWith("/professor/atividades")) return "atividades";
  if (pathname.startsWith("/professor/configuracoes")) return "configuracoes";
  return "dashboard";
}

export function Sidebar({ professor }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ativo = detectarAtivo(pathname);

  const sair = async () => {
    // Registra o logout no log de auditoria antes de limpar o token — se a
    // chamada falhar (rede fora, token já expirado), o logout no front
    // acontece do mesmo jeito, só sem o registro no backend.
    try {
      await apiRequest("/auth_kivira/logout", { method: "POST" });
    } catch {
      // ignora: logout local não pode ficar travado por causa do log
    }
    limparSessao();
    navigate("/login");
  };

  return (
    <aside className="fixed bottom-0 inset-x-0 z-40 h-16 flex flex-row items-center gap-1 px-2 lg:inset-x-auto lg:z-auto lg:h-screen lg:w-64 lg:flex-col lg:items-stretch lg:gap-0 lg:px-6 lg:py-3 lg:sticky lg:top-0 lg:self-start bg-azul text-branco justify-between shadow-lg print:hidden">
      <div className="flex-1 lg:flex-none">
        <div className="hidden lg:flex items-center mb-3 px-1">
          <LogoKiviraRosa className="w-36 h-auto" />
        </div>

        <p className="hidden lg:block text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
          Menu
        </p>
        <nav className="flex flex-row justify-around lg:flex-col lg:justify-start gap-1 lg:gap-2">
          <Link
            to="/professor"
            className={`flex flex-col lg:flex-row items-center gap-0.5 lg:gap-3 px-1 sm:px-2 py-1.5 lg:px-4 lg:py-3 rounded-xl text-[11px] lg:text-base transition ${
              ativo === "dashboard"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <House size={20} />
            Dashboard
          </Link>
          <Link
            to="/professor/turmas"
            className={`flex flex-col lg:flex-row items-center gap-0.5 lg:gap-3 px-1 sm:px-2 py-1.5 lg:px-4 lg:py-3 rounded-xl text-[11px] lg:text-base transition ${
              ativo === "turmas"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <Users size={20} />
            Turmas
          </Link>
          <Link
            to="/professor/atividades"
            className={`flex flex-col lg:flex-row items-center gap-0.5 lg:gap-3 px-1 sm:px-2 py-1.5 lg:px-4 lg:py-3 rounded-xl text-[11px] lg:text-base transition ${
              ativo === "atividades"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <Blocks size={20} />
            Atividades
          </Link>
          <Link
            to="/professor/configuracoes"
            className={`flex flex-col lg:flex-row items-center gap-0.5 lg:gap-3 px-1 sm:px-2 py-1.5 lg:px-4 lg:py-3 rounded-xl text-[11px] lg:text-base transition ${
              ativo === "configuracoes"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <Settings size={20} />
            <span className="sm:hidden">Ajustes</span>
            <span className="hidden sm:inline">Configurações</span>
          </Link>
        </nav>
      </div>

      {/* Perfil na base do Menu */}
      <div className="pl-2 border-l lg:pl-0 lg:pt-4 lg:border-l-0 lg:border-t border-branco/15 flex items-center justify-between gap-3">
        <div className="hidden lg:flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase shadow-sm shrink-0">
            {professor?.avatar_url ? (
              <img
                src={`/avatares/${professor.avatar_url}`}
                alt="Seu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              "P"
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-branco">
              {professor?.apelido}
            </p>
            <Link
              to="/professor/configuracoes"
              className="text-xs text-laranja hover:underline"
            >
              Ver perfil &rarr;
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={sair}
          className="px-2 py-3 lg:p-0 text-xs text-laranja hover:underline shrink-0"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
