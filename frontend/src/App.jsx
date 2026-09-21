import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProfessorLayout } from "./components/professor/ProfessorLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RequireRole } from "./components/RequireRole";

// Code-splitting por rota: cada página vira um chunk carregado só quando o
// usuário navega até ela — antes, tudo (telas de professor, admin, aluno, o
// jogo com Framer Motion e canvas-confetti) ia num único bundle de ~550KB
// baixado de uma vez no primeiro acesso, mesmo por quem só ia fazer login.
const Login = lazy(() => import("./pages/auth/Login"));
const LoginAluno = lazy(() => import("./pages/auth/LoginAluno"));
const LoginEmoji = lazy(() => import("./pages/auth/LoginEmoji"));
const Cadastro = lazy(() => import("./pages/auth/Cadastro"));
const JogoAndamento = lazy(() => import("./pages/jogo/JogoAndamento"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/professor/Dashboard"));
const Turmas = lazy(() => import("./pages/professor/Turmas"));
const TurmaForm = lazy(() => import("./pages/professor/TurmaForm"));
const Atividades = lazy(() => import("./pages/professor/Atividades"));
const CriarAtividade = lazy(() => import("./pages/professor/CriarAtividade"));
const Configuracoes = lazy(() => import("./pages/professor/Configuracoes"));
const PrimeiroAcesso = lazy(() => import("./pages/aluno/PrimeiroAcesso"));
const EscolherAvatar = lazy(() => import("./pages/aluno/EscolherAvatar"));
const HomeAluno = lazy(() => import("./pages/aluno/HomeAluno"));
const TurmasAluno = lazy(() => import("./pages/aluno/Turmas"));
const TurmaDetalhe = lazy(() => import("./pages/aluno/TurmaDetalhe"));
const Historico = lazy(() => import("./pages/aluno/Historico"));
const ConfiguracoesAluno = lazy(() => import("./pages/aluno/Configuracoes"));
const Usuarios = lazy(() => import("./pages/admin/Usuarios"));
const LogsAuditoria = lazy(() => import("./pages/admin/LogsAuditoria"));

function CarregandoRota() {
  return (
    <div className="min-h-screen bg-bege flex items-center justify-center">
      <p className="text-azul/60 font-medium">Carregando...</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<CarregandoRota />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login_aluno" element={<LoginAluno />} />
        <Route path="/login_emoji" element={<LoginEmoji />} />
        <Route path="/primeiro_acesso" element={<PrimeiroAcesso />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/jogo" element={<JogoAndamento />} />
        <Route path="/" element={<Home />} />

        {/* Só professor e admin passam daqui — aluno ou visitante sem token são
            redirecionados antes de a tela sequer montar (ver RequireRole) */}
        <Route element={<RequireRole allowedRoles={["professor", "admin"]} />}>
          {/* Layout compartilhado: Sidebar monta uma vez só e continua viva
              entre as navegações dentro de /professor/* (ver ProfessorLayout) */}
          <Route element={<ProfessorLayout />}>
            <Route path="/professor" element={<Dashboard />} />
            <Route path="/professor/turmas" element={<Turmas />} />
            <Route path="/professor/turmas/nova" element={<TurmaForm />} />
            <Route path="/professor/turmas/:id/editar" element={<TurmaForm />} />
            <Route path="/professor/atividades" element={<Atividades />} />
            <Route path="/professor/atividades/criar" element={<CriarAtividade />} />
            <Route path="/professor/atividades/:id/editar" element={<CriarAtividade />} />
            <Route path="/professor/configuracoes" element={<Configuracoes />} />
          </Route>
        </Route>

        <Route path="/aluno/escolher-avatar" element={<EscolherAvatar />} />
        <Route path="/aluno/home" element={<HomeAluno />} />
        <Route path="/aluno/turmas" element={<TurmasAluno />} />
        <Route path="/aluno/turmas/:id" element={<TurmaDetalhe />} />
        <Route path="/aluno/historico" element={<Historico />} />
        <Route path="/aluno/configuracoes" element={<ConfiguracoesAluno />} />

        {/* Só admin passa daqui (ver RequireRole) */}
        <Route element={<RequireRole allowedRoles={["admin"]} />}>
          {/* Layout compartilhado das rotas /admin/* (ver AdminLayout) */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Usuarios />} />
            <Route path="/admin/logs-auditoria" element={<LogsAuditoria />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
