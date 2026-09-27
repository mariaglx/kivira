import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogoKivira } from "../LogoKivira";
import { BarraProgresso } from "../ui/BarraProgresso";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";
import { apiRequest } from "../../services/api";
import { limparSessao } from "../../services/sessao";
import { MapPinIcon } from "../icons/map-pin";
import { SparklesIcon } from "../icons/sparkles";
import { UsersIcon } from "../icons/users";
import { SettingsIcon } from "../icons/settings";

const ABAS = [
  { to: "/aluno/home", Icone: MapPinIcon, rotulo: "Trilha de Jogos" },
  { to: "/aluno/conquistas", Icone: SparklesIcon, rotulo: "Conquistas" },
  { to: "/aluno/turmas", Icone: UsersIcon, rotulo: "Minha Turma" },
];

function AvatarAluno({ aluno, className = "w-10 h-10 text-sm" }) {
  return (
    <div
      className={`${className} rounded-xl bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase ring-2 ring-laranja shrink-0`}
    >
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
  );
}

// Cabeçalho fixo das telas do aluno — 3 blocos: logo, abas em pílula (a
// navegação inteira mora aqui agora, sem uma segunda barra abaixo) e o badge
// do aluno com XP + dropdown de Ajustes/Sair.
export function HeaderAluno({ aluno }) {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const sair = async () => {
    try {
      await apiRequest("/auth_kivira/logout", { method: "POST" });
    } catch {
      // ignora: logout local não pode ficar travado por causa do log
    }
    limparSessao();
    navigate("/login_aluno");
  };

  return (
    <header className="sticky top-0 z-30 bg-branco border-b-2 border-laranja/30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      <Link to="/aluno/home" className="shrink-0">
        <LogoKivira className="h-9 w-auto" />
      </Link>

      <nav className="flex items-center gap-1.5 overflow-x-auto">
        {ABAS.map(({ to, Icone, rotulo }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                isActive
                  ? "bg-coral text-branco"
                  : "bg-bege/70 text-azul/60 hover:bg-bege"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icone size={18} isAnimated={false} color={isActive ? "#fff" : undefined} />
                <span className="hidden sm:inline">{rotulo}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden md:flex flex-col w-32">
          <span className="text-[11px] font-bold text-coral leading-tight">
            Nível {aluno?.nivel_atual}
          </span>
          <BarraProgresso
            valor={xpNoNivel(aluno?.xp_total)}
            max={XP_POR_NIVEL}
            className="h-2"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu do perfil"
          >
            <AvatarAluno aluno={aluno} />
          </button>

          {menuAberto && (
            <>
              {/* Camada invisível pra fechar o menu ao clicar fora, mesmo
                  padrão de overlay já usado nos modais do app */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-branco rounded-2xl shadow-lg border border-cinza-claro/30 py-2 w-48">
                <Link
                  to="/aluno/configuracoes"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-azul hover:bg-bege/60"
                >
                  <SettingsIcon size={16} isAnimated={false} />
                  Ajustes
                </Link>
                <button
                  type="button"
                  onClick={sair}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-coral hover:bg-bege/60"
                >
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
