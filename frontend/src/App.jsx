import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/auth/Login";
import { LoginAluno } from "./pages/auth/LoginAluno";
import { LoginEmoji } from "./pages/auth/LoginEmoji";
import { Cadastro } from "./pages/auth/Cadastro";
import { JogoAndamento } from "./pages/jogo/JogoAndamento";
import { Home } from "./pages/Home";
import { ProfessorLayout } from "./components/professor/ProfessorLayout";
import { Dashboard } from "./pages/professor/Dashboard";
import { Turmas } from "./pages/professor/Turmas";
import { TurmaForm } from "./pages/professor/TurmaForm";
import { Atividades } from "./pages/professor/Atividades";
import { CriarAtividade } from "./pages/professor/CriarAtividade";
import { Configuracoes } from "./pages/professor/Configuracoes";
import { PrimeiroAcesso } from "./pages/aluno/PrimeiroAcesso";
import { EscolherAvatar } from "./pages/aluno/EscolherAvatar";
import { HomeAluno } from "./pages/aluno/HomeAluno";
import { Turmas as TurmasAluno } from "./pages/aluno/Turmas";
import { TurmaDetalhe } from "./pages/aluno/TurmaDetalhe";
import { Historico } from "./pages/aluno/Historico";
import { Configuracoes as ConfiguracoesAluno } from "./pages/aluno/Configuracoes";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login_aluno" element={<LoginAluno />} />
      <Route path="/login_emoji" element={<LoginEmoji />} />
      <Route path="/primeiro_acesso" element={<PrimeiroAcesso />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/jogo" element={<JogoAndamento />} />
      <Route path="/" element={<Home />} />

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

      <Route path="/aluno/escolher-avatar" element={<EscolherAvatar />} />
      <Route path="/aluno/home" element={<HomeAluno />} />
      <Route path="/aluno/turmas" element={<TurmasAluno />} />
      <Route path="/aluno/turmas/:id" element={<TurmaDetalhe />} />
      <Route path="/aluno/historico" element={<Historico />} />
      <Route path="/aluno/configuracoes" element={<ConfiguracoesAluno />} />
    </Routes>
  );
}

export default App;
