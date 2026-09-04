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
import { TurmaDetalhe } from "./pages/professor/TurmaDetalhe";
import { Atividades } from "./pages/professor/Atividades";
import { CriarAtividade } from "./pages/professor/CriarAtividade";
import { Configuracoes } from "./pages/professor/Configuracoes";
import { PrimeiroAcesso } from "./pages/aluno/PrimeiroAcesso";
import { EscolherAvatar } from "./pages/aluno/EscolherAvatar";
import { HomeAluno } from "./pages/aluno/HomeAluno";

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
        <Route path="/professor/turmas/:id" element={<TurmaDetalhe />} />
        <Route path="/professor/turmas/:id/editar" element={<TurmaForm />} />
        <Route path="/professor/atividades" element={<Atividades />} />
        <Route path="/professor/atividades/criar" element={<CriarAtividade />} />
        <Route path="/professor/atividades/:id/editar" element={<CriarAtividade />} />
        <Route path="/professor/configuracoes" element={<Configuracoes />} />
      </Route>

      <Route path="/aluno/escolher-avatar" element={<EscolherAvatar />} />
      <Route path="/aluno/home" element={<HomeAluno />} />
    </Routes>
  );
}

export default App;
