import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "motion/react";
import { House, Users, Blocks, Settings } from "lucide-react";
import { SidebarPainel } from "../SidebarPainel";
import { useProfessorAtual } from "../../controllers/useProfessorAtual";

const ITENS = [
  { to: "/professor", Icone: House, rotulo: "Dashboard", end: true },
  { to: "/professor/turmas", Icone: Users, rotulo: "Turmas" },
  { to: "/professor/atividades", Icone: Blocks, rotulo: "Atividades" },
  { to: "/professor/configuracoes", Icone: Settings, rotulo: "Configurações" },
];

// Layout compartilhado pelas rotas /professor/*: o menu monta UMA vez só e
// continua vivo entre as navegações (em vez de cada página recriá-lo do zero),
// então o /professor/me só é buscado uma vez por sessão, não a cada troca de tela.
//
// O "quem é o professor logado" é buscado AQUI (uma vez só) e repassado pro
// menu e pras páginas (via contexto do Outlet) — assim editar o perfil em
// Configurações reflete na hora no avatar/apelido do menu.
export function ProfessorLayout() {
  const { professor, setProfessor, carregando } = useProfessorAtual();
  const { pathname } = useLocation();

  return (
    <MotionConfig reducedMotion="user">
    <div className="lg:flex min-h-screen bg-bege text-azul font-sans">
      <SidebarPainel
        titulo="Menu"
        itens={ITENS}
        usuario={{
          nome: professor?.apelido || "Professor(a)",
          avatar: professor?.avatar_url,
          perfilUrl: "/professor/configuracoes",
        }}
      />
      {/* key = rota: cada tela entra com fade + sobe. O wrapper repete o
          "flex-1 min-w-0" do <main className="pagina"> que antes era filho direto */}
      <motion.div
        key={pathname}
        className="flex-1 min-w-0 flex flex-col"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Outlet context={{ professor, setProfessor, carregandoProfessor: carregando }} />
      </motion.div>
    </div>
    </MotionConfig>
  );
}
