import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogoKivira } from "../LogoKivira";
import { BarraProgresso } from "../ui/BarraProgresso";
import { Avatar } from "../ui/Avatar";
import { XP_POR_NIVEL, xpNoNivel } from "../../utils/xp";
import { apiRequest } from "../../services/api";
import { limparSessao } from "../../services/sessao";
import { MapPin, Sparkles, Users, Settings } from "lucide-react";

const ABAS = [
  { to: "/aluno/home", Icone: MapPin, rotulo: "Trilha de Jogos" },
  { to: "/aluno/conquistas", Icone: Sparkles, rotulo: "Conquistas" },
  { to: "/aluno/turmas", Icone: Users, rotulo: "Minha Turma" },
];

// Cabeçalho fixo das telas do aluno — 3 blocos: logo, abas em pílula e o
// badge do aluno com XP + dropdown de Ajustes/Sair. No celular as abas descem
// pra uma barra fixa no rodapé (ícone + nome), ao alcance do polegar — no topo
// sobravam só ícones sem nome, difíceis de entender pra criança.
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

      <nav className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-3 gap-1 bg-branco border-t-2 border-laranja/30 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:static sm:flex sm:items-center sm:gap-1.5 sm:border-0 sm:p-0 sm:bg-transparent">
        {ABAS.map(({ to, Icone, rotulo }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={rotulo}
            className={({ isActive }) =>
              `shrink-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl sm:rounded-full text-[11px] sm:text-sm font-bold transition-colors ${
                isActive
                  ? "bg-coral text-branco"
                  : "text-azul/60 hover:bg-bege sm:bg-bege/70"
              }`
            }
          >
            <Icone size={20} />
            <span className="sm:hidden lg:inline">{rotulo}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex flex-col w-24 sm:w-32">
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
            <Avatar
              arquivo={aluno?.avatar_url}
              nome={aluno?.apelido || aluno?.nome_completo || "A"}
              className="w-10 h-10 text-sm rounded-xl ring-2 ring-laranja"
            />
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
                  <Settings size={16} />
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
