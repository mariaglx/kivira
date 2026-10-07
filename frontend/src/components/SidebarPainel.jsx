import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LogoKiviraRosa } from "./LogoKiviraRosa";
import { Avatar } from "./ui/Avatar";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";

// Menu lateral compartilhado por professor e admin. No desktop (lg+) é a
// coluna azul fixa de sempre; abaixo disso vira uma barra no topo com botão
// que abre o mesmo menu como gaveta — antes a coluna de 256px ficava fixa e
// esmagava o conteúdo no celular/tablet.
//
// `itens`: [{ to, Icone, rotulo, end? }] — `end` pra rota raiz (/professor,
// /admin) não ficar ativa em todas as sub-rotas.
// `usuario`: { nome, avatar, perfilUrl? } pro rodapé.
export function SidebarPainel({ titulo, itens, usuario }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

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
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-azul text-branco flex items-center justify-between px-4 py-2 shadow-md print:hidden">
        <LogoKiviraRosa className="w-28 h-auto" />
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="p-2 -mr-2 rounded-xl hover:bg-branco/10"
        >
          <Menu size={26} />
        </button>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-40 bg-azul/50 lg:hidden" onClick={fechar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-azul text-branco flex flex-col justify-between px-6 py-3 shadow-lg transition-transform duration-200 lg:sticky lg:top-0 lg:self-start lg:shrink-0 lg:translate-x-0 print:hidden ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <LogoKiviraRosa className="w-36 h-auto" />
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar menu"
              className="lg:hidden p-2 -mr-2 rounded-xl hover:bg-branco/10"
            >
              <X size={22} />
            </button>
          </div>

          <p className="text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
            {titulo}
          </p>
          <nav className="flex flex-col gap-2">
            {itens.map(({ to, Icone, rotulo, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={fechar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-laranja text-azul font-bold shadow-md shadow-laranja/40"
                      : "text-cinza-claro hover:bg-branco/5 hover:text-branco font-medium"
                  }`
                }
              >
                <Icone size={20} />
                {rotulo}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-branco/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar arquivo={usuario.avatar} nome={usuario.nome} className="w-10 h-10 rounded-xl shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-branco">{usuario.nome}</p>
              {usuario.perfilUrl && (
                <Link
                  to={usuario.perfilUrl}
                  onClick={fechar}
                  className="text-xs text-laranja hover:underline"
                >
                  Ver perfil &rarr;
                </Link>
              )}
            </div>
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
    </>
  );
}
