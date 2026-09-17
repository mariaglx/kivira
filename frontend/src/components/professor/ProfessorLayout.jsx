import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useProfessorAtual } from "../../controllers/useProfessorAtual";

// Layout compartilhado pelas rotas /professor/*: o Sidebar monta UMA vez só e
// continua vivo entre as navegações (em vez de cada página recriá-lo do zero),
// então o /professor/me só é buscado uma vez por sessão, não a cada troca de tela.
//
// O "quem é o professor logado" é buscado AQUI (uma vez só) e repassado pro
// Sidebar e pras páginas (via contexto do Outlet) — antes, a Sidebar e a tela
// de Configurações buscavam /professor/me cada uma por conta própria, então
// editar o perfil em Configurações não refletia no avatar/apelido da Sidebar
// até recarregar a página inteira.
export function ProfessorLayout() {
  const { professor, setProfessor, carregando } = useProfessorAtual();

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar professor={professor} />
      <Outlet context={{ professor, setProfessor, carregandoProfessor: carregando }} />
    </div>
  );
}
