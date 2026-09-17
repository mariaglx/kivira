import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

// Layout compartilhado pelas rotas /admin/*, no mesmo formato do ProfessorLayout:
// o Sidebar monta uma vez só e continua vivo entre as navegações.
export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar />
      <Outlet />
    </div>
  );
}
