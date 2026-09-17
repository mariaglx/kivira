import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogoKiviraRosa } from "../LogoKiviraRosa";
import { UsersIcon } from "../icons/users";
import { ClipboardListIcon } from "../icons/clipboard-list";
import { apiRequest } from "../../services/api";

function detectarAtivo(pathname) {
  if (pathname.startsWith("/admin/logs-auditoria")) return "logs";
  return "usuarios";
}

export function Sidebar() {
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
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_type");
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-azul text-branco flex flex-col justify-between px-6 py-3 shadow-lg sticky top-0 h-screen self-start">
      <div>
        <div className="flex items-center mb-3 px-1">
          <LogoKiviraRosa className="w-36 h-auto" />
        </div>

        <p className="text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
          Administração
        </p>
        <nav className="flex flex-col gap-2">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "usuarios"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <UsersIcon size={20} isAnimated={false} />
            Usuários
          </Link>
          <Link
            to="/admin/logs-auditoria"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "logs"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <ClipboardListIcon size={20} />
            Logs de auditoria
          </Link>
        </nav>
      </div>

      {/* Rodapé: admin não tem perfil próprio (só professor/aluno têm),
          então aqui é só um label fixo + sair */}
      <div className="pt-4 border-t border-branco/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center font-bold text-branco uppercase shadow-sm shrink-0">
            A
          </div>
          <p className="text-sm font-semibold truncate text-branco">
            Administrador
          </p>
        </div>
        <button
          type="button"
          onClick={sair}
          className="text-xs text-laranja hover:underline shrink-0"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
