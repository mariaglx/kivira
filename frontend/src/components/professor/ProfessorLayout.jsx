import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

// Layout compartilhado pelas rotas /professor/*: o Sidebar monta UMA vez só e
// continua vivo entre as navegações (em vez de cada página recriá-lo do zero),
// então o /professor/me só é buscado uma vez por sessão, não a cada troca de tela.
export function ProfessorLayout() {
  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar />
      <Outlet />
    </div>
  );
}
