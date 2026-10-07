import { Outlet } from "react-router-dom";
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

  return (
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
      <Outlet context={{ professor, setProfessor, carregandoProfessor: carregando }} />
    </div>
  );
}
