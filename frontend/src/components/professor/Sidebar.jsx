import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LogoKiviraRosa } from "../LogoKiviraRosa";

export function Sidebar({ ativo, professor }) {
  return (
    <aside className="w-64 bg-azul text-branco flex flex-col justify-between px-6 py-3 shadow-lg sticky top-0 h-screen self-start">
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "dashboard"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <FontAwesomeIcon icon={["fas", "house"]} className="w-5" />
            Dashboard
          </Link>
          <Link
            to="/professor/turmas"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "turmas"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <FontAwesomeIcon icon={["fas", "users"]} className="w-5" />
            Turmas
          </Link>
          <Link
            to="/professor/atividades"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "atividades"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <FontAwesomeIcon icon={["fas", "puzzle-piece"]} className="w-5" />
            Atividades
          </Link>
          <Link
            to="/professor/configuracoes"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              ativo === "configuracoes"
                ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
            }`}
          >
            <FontAwesomeIcon icon={["fas", "gear"]} className="w-5" />
            Configurações
          </Link>
        </nav>
      </div>

      {/* Perfil na base do Menu */}
      <div className="pt-4 border-t border-branco/15 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase shadow-sm shrink-0">
          {professor?.avatar ? (
            <img
              src={`/avatares/${professor.avatar}`}
              alt="Seu avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            "P"
          )}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate text-branco">
            {professor?.apelido || "Professor(a)"}
          </p>
          <Link
            to="/professor/configuracoes"
            className="text-xs text-laranja hover:underline"
          >
            Ver perfil &rarr;
          </Link>
        </div>
      </div>
    </aside>
  );
}
