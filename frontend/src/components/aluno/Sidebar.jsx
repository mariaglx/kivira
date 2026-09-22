import { Link, useLocation } from "react-router-dom";
import { LogoKiviraRosa } from "../LogoKiviraRosa";
import { HouseIcon } from "../icons/house";
import { UsersIcon } from "../icons/users";
import { BookOpenIcon } from "../icons/book-open";
import { SettingsIcon } from "../icons/settings";
import { BarraProgresso } from "../ui/BarraProgresso";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";

// Mesma ideia do Sidebar do professor: a aba ativa sai da própria URL, então
// nenhuma página precisa lembrar de passar `ativo`.
function detectarAtivo(pathname) {
  if (pathname.startsWith("/aluno/turmas")) return "turmas";
  if (pathname.startsWith("/aluno/historico")) return "historico";
  if (
    pathname.startsWith("/aluno/configuracoes") ||
    pathname.startsWith("/aluno/escolher-avatar")
  ) {
    return "configuracoes";
  }
  return "dashboard";
}

export function Sidebar({ aluno, onSair }) {
  const { pathname } = useLocation();
  const ativo = detectarAtivo(pathname);

  const classe = (id) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
      ativo === id
        ? "tatil bg-laranja text-azul font-bold [--sombra:var(--color-laranja-escuro)]"
        : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
    }`;

  return (
    <aside className="w-64 shrink-0 bg-azul text-branco flex flex-col justify-between px-6 py-3 shadow-lg sticky top-0 h-screen self-start">
      <div>
        <div className="flex items-center mb-3 px-1">
          <LogoKiviraRosa className="w-36 h-auto" />
        </div>

        <p className="text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
          Menu
        </p>

        <nav className="flex flex-col gap-2">
          <Link to="/aluno/home" className={classe("dashboard")}>
            <HouseIcon size={20} isAnimated={false} />
            Dashboard
          </Link>
          <Link to="/aluno/turmas" className={classe("turmas")}>
            <UsersIcon size={20} isAnimated={false} />
            Turmas
          </Link>
          <Link to="/aluno/historico" className={classe("historico")}>
            <BookOpenIcon size={20} isAnimated={false} />
            Histórico
          </Link>
          <Link to="/aluno/configuracoes" className={classe("configuracoes")}>
            <SettingsIcon size={20} isAnimated={false} />
            Configurações
          </Link>
        </nav>
      </div>

      {/* Perfil na base do Menu */}
      <div className="pt-4 border-t border-branco/15 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase ring-2 ring-laranja shrink-0">
            {aluno?.avatar_url ? (
              <img
                src={`/avatares/${aluno.avatar_url}`}
                alt="Seu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (aluno?.apelido || aluno?.nome_completo || "A").charAt(0)
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-branco">
              {aluno?.apelido || aluno?.nome_completo}
            </p>
            <p className="text-xs text-laranja font-bold truncate">
              Nível {aluno?.nivel_atual}
            </p>
          </div>
        </div>

        <div>
          <BarraProgresso
            valor={xpNoNivel(aluno?.xp_total)}
            max={XP_POR_NIVEL}
            trilha="bg-branco/15"
            preenchimento="bg-laranja"
          />
          <p className="text-[11px] text-cinza-claro/70 mt-1">
            {xpNoNivel(aluno?.xp_total)}/{XP_POR_NIVEL} XP pro próximo nível
          </p>
        </div>

        <button
          type="button"
          onClick={onSair}
          className="text-xs font-bold text-cinza-claro/70 hover:text-coral transition text-left px-1 cursor-pointer"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
