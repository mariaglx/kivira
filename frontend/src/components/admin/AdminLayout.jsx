import { Outlet } from "react-router-dom";
import { Users, ClipboardList } from "lucide-react";
import { SidebarPainel } from "../SidebarPainel";

const ITENS = [
  { to: "/admin", Icone: Users, rotulo: "Usuários", end: true },
  { to: "/admin/logs-auditoria", Icone: ClipboardList, rotulo: "Logs de auditoria" },
];

// Layout compartilhado pelas rotas /admin/*, no mesmo formato do ProfessorLayout.
// Admin não tem perfil próprio, então o rodapé do menu é só um rótulo fixo.
export function AdminLayout() {
  return (
    <div className="lg:flex min-h-screen bg-bege text-azul font-sans">
      <SidebarPainel titulo="Administração" itens={ITENS} usuario={{ nome: "Administrador" }} />
      <Outlet />
    </div>
  );
}
