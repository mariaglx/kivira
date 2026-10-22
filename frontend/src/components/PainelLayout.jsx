import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "motion/react";
import { House, Users, Blocks, Settings, UserCog, ShieldCheck, MessageSquare } from "lucide-react";
import { SidebarPainel } from "./SidebarPainel";
import { useProfessorAtual } from "../controllers/useProfessorAtual";
import { useApi } from "../controllers/useApi";
import { ehAdmin } from "../services/sessao";

// Entra no fim do menu só enquanto o professor não respondeu o questionário.
const ITEM_FEEDBACK = { to: "/professor/feedback", Icone: MessageSquare, rotulo: "Feedback" };

function montarItens(turmas, admin, professor) {
  const turmasComSubmenu = {
    to: "/professor/turmas",
    Icone: Users,
    rotulo: "Turmas",
    subitens: turmas.map((t) => ({ to: `/professor/turmas/${t.id}`, rotulo: t.nome })),
  };
  const atividades = { to: "/professor/atividades", Icone: Blocks, rotulo: "Atividades" };

  // Admin usa as mesmas telas do professor (vendo turmas e atividades de todos)
  // mais as dele: usuários e auditoria. Não tem perfil próprio pra configurar.
  if (admin) {
    return [
      { to: "/professor", Icone: House, rotulo: "Painel", end: true },
      turmasComSubmenu,
      atividades,
      { to: "/admin", Icone: UserCog, rotulo: "Usuários", end: true },
      { to: "/admin/logs-auditoria", Icone: ShieldCheck, rotulo: "Auditoria" },
    ];
  }
  // A condição é "já sei que não respondeu", não "não respondeu": com professor
  // ainda null durante o carregamento, a segunda forma mostraria o item e o
  // tiraria em seguida na cara de quem já respondeu.
  const feedback = professor && !professor.respondeu_feedback ? [ITEM_FEEDBACK] : [];
  return [
    { to: "/professor", Icone: House, rotulo: "Dashboard", end: true },
    turmasComSubmenu,
    atividades,
    { to: "/professor/configuracoes", Icone: Settings, rotulo: "Configurações" },
    ...feedback,
  ];
}

// Layout compartilhado pelas rotas /professor/* e /admin/*: o menu monta UMA vez
// só e continua vivo entre as navegações (em vez de cada página recriá-lo do
// zero), então o /professor/me só é buscado uma vez por sessão.
//
// O "quem é o professor logado" é buscado AQUI (uma vez só) e repassado pro
// menu e pras páginas (via contexto do Outlet) — assim editar o perfil em
// Configurações reflete na hora no avatar/apelido do menu. Admin não tem
// cadastro de professor, então pula essa busca.
export function PainelLayout() {
  const admin = ehAdmin();
  const { professor, setProfessor, carregando } = useProfessorAtual(!admin);
  const { pathname } = useLocation();
  // Turmas do submenu de "Turmas". Rebusca a cada navegação (sai do cache do
  // apiRequest) pra turma recém-criada aparecer sem recarregar a página.
  const { dados: turmas } = useApi("/turma/", pathname);
  // Avatar do admin (perfil_admin); a tela de perfil troca e avisa por aqui
  const { dados: perfilAdmin } = useApi(admin ? "/admin/me" : null);
  const [avatarAdminNovo, setAvatarAdmin] = useState(null);
  const avatarAdmin = avatarAdminNovo ?? perfilAdmin?.avatar_url;

  return (
    <MotionConfig reducedMotion="user">
    <div className="lg:flex min-h-screen bg-bege text-azul font-sans">
      <SidebarPainel
        titulo={admin ? "Administração" : "Menu"}
        itens={montarItens(turmas ?? [], admin, professor)}
        usuario={
          admin
            ? { nome: "Administrador", avatar: avatarAdmin, perfilUrl: "/admin/perfil" }
            : {
                nome: professor?.apelido || "Professor(a)",
                avatar: professor?.avatar_url,
                perfilUrl: "/professor/configuracoes",
              }
        }
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
        <Outlet context={{ professor, setProfessor, carregandoProfessor: carregando, perfilAdmin, avatarAdmin, setAvatarAdmin }} />
      </motion.div>
    </div>
    </MotionConfig>
  );
}
