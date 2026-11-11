import { useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LogoKiviraRosa } from "./LogoKiviraRosa";
import { Avatar } from "./ui/Avatar";
import { apiRequest } from "../services/api";
import { limparSessao } from "../services/sessao";
import { useFecharComEsc } from "../controllers/useFecharComEsc";

// Menu lateral compartilhado por professor e admin. No desktop (lg+) é a
// coluna azul fixa de sempre; abaixo disso vira uma barra no topo com botão
// que abre o mesmo menu como gaveta — antes a coluna de 256px ficava fixa e
// esmagava o conteúdo no celular/tablet.
//
// `itens`: [{ to, Icone, rotulo, end?, subitens?, selo?, inferior? }] — `end`
// pra rota raiz (/professor, /admin) não ficar ativa em todas as sub-rotas;
// `subitens` ([{ to, rotulo, atencao? }]) aparecem aninhados embaixo enquanto a
// seção está aberta (`atencao` = ponto laranja); `selo` é o texto da pílula ao
// lado do rótulo; `inferior` manda o item pro grupo de baixo, menor.
// `titulo`: rótulo acima do menu (só o admin usa). `acao`: { to, rotulo } do
// botão coral no topo. `usuario`: { nome, avatar, subtitulo?, perfilUrl? }.
export function SidebarPainel({ titulo, itens, usuario, acao }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  const refBotaoMenu = useRef(null);
  useFecharComEsc(aberto, fechar, refBotaoMenu);

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
          ref={refBotaoMenu}
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="p-2 -mr-2 rounded-xl hover:bg-branco/10"
        >
          <Menu size={26} />
        </button>
      </header>

      <AnimatePresence>
        {aberto && (
          <motion.div
            className="fixed inset-0 z-40 bg-azul/50 lg:hidden"
            onClick={fechar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-screen bg-azul text-branco flex flex-col justify-between gap-4 overflow-y-auto px-4 py-3 shadow-lg transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:self-start lg:shrink-0 lg:translate-x-0 print:hidden ${
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

          {titulo && (
            <p className="text-xs font-bold text-laranja-claro tracking-widest uppercase mb-4">
              {titulo}
            </p>
          )}
          {acao && (
            <Link
              to={acao.to}
              onClick={fechar}
              className="tatil mb-4 flex items-center justify-center gap-2 rounded-xl bg-coral text-azul-escuro font-display font-extrabold px-4 min-h-11 [--sombra:var(--color-coral-escuro)]"
            >
              <Plus size={18} /> {acao.rotulo}
            </Link>
          )}
          <nav className="flex flex-col gap-1.5">
            {itens.filter((i) => !i.inferior).map((item) => (
              <ItemMenu key={item.to} item={item} titulo={titulo} pathname={pathname} fechar={fechar} />
            ))}
          </nav>
        </div>

        <div>
          <nav className="flex flex-col gap-1 mb-2" aria-label="Outras opções">
            {itens.filter((i) => i.inferior).map((item) => (
              <ItemMenu key={item.to} item={item} titulo={titulo} pathname={pathname} fechar={fechar} pequeno />
            ))}
          </nav>
        <div className="pt-3 border-t border-branco/20 flex items-center justify-between gap-3">
          <PerfilRodape usuario={usuario} fechar={fechar} />
          <button
            type="button"
            onClick={sair}
            title="Sair"
            aria-label="Sair"
            className="alvo-toque w-[38px] h-[38px] shrink-0 rounded-[10px] bg-branco/15 text-laranja-claro flex items-center justify-center hover:bg-branco/25 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}

function PerfilRodape({ usuario, fechar }) {
  const conteudo = (
    <>
      <Avatar arquivo={usuario.avatar} nome={usuario.nome} className="w-11 h-11 rounded-xl ring-2 ring-laranja ring-offset-1 ring-offset-azul" />
      <div className="min-w-0">
        <p className="font-display font-extrabold text-sm truncate text-branco">{usuario.nome}</p>
        {usuario.subtitulo && <p className="text-xs truncate text-branco/85">{usuario.subtitulo}</p>}
      </div>
    </>
  );
  return usuario.perfilUrl ? (
    <Link to={usuario.perfilUrl} onClick={fechar} className="flex items-center gap-3 min-w-0 rounded-xl hover:bg-branco/5">
      {conteudo}
    </Link>
  ) : (
    <div className="flex items-center gap-3 min-w-0">{conteudo}</div>
  );
}

function ItemMenu({ item, titulo, pathname, fechar, pequeno = false }) {
  const { to, Icone, rotulo, end, subitens, selo } = item;
  return (
    <div className="flex flex-col gap-1">
      <NavLink
        to={to}
        end={end}
        onClick={fechar}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 px-4 rounded-xl font-display transition active:scale-95 ${
            pequeno ? "py-2.5 text-[15px]" : "py-3 text-base"
          } ${
            isActive
              ? "text-azul-escuro font-extrabold"
              : `font-bold hover:bg-branco/5 hover:text-branco ${pequeno ? "text-branco/85" : "text-branco/90"}`
          }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId={`${titulo ?? "painel"}-item-ativo`}
                className="absolute inset-0 rounded-xl bg-laranja"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icone size={pequeno ? 18 : 20} className="relative shrink-0 transition-transform group-hover:scale-110" />
            <span className="relative flex-1 min-w-0 truncate">{rotulo}</span>
            {selo && (
              <span className={`relative shrink-0 rounded-full px-2 py-px text-[11px] font-sans font-bold ${isActive ? "bg-azul-escuro/15" : "bg-branco/15"}`}>
                {selo}
              </span>
            )}
          </>
        )}
      </NavLink>
      {subitens?.length > 0 && pathname.startsWith(to) && (
        <div className="ml-6 pl-3 border-l-2 border-branco/20 flex flex-col gap-0.5">
          {subitens.map((sub) => (
            <NavLink
              key={sub.to}
              to={sub.to}
              title={sub.rotulo}
              onClick={fechar}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 transition ${
                  isActive ? "bg-branco/10 text-laranja font-bold" : "text-branco/85 font-semibold hover:text-branco hover:bg-branco/5"
                }`
              }
            >
              <span className="truncate">{sub.rotulo}</span>
              {sub.atencao && (
                <span className="w-2 h-2 shrink-0 rounded-full bg-laranja" title="Precisa de atenção" aria-label="Precisa de atenção" />
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
