import { Routes, Route } from "react-router-dom";
import { Login } from "./pages/auth/Login";
import { LoginAluno } from "./pages/auth/LoginAluno";
import { Cadastro } from "./pages/auth/Cadastro";
import { JogoAndamento } from "./pages/jogo/JogoAndamento";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/professor/Dashboard";
import { Turmas } from "./pages/professor/Turmas";
import { Atividades } from "./pages/professor/Atividades";
import { CriarAtividade } from "./pages/professor/CriarAtividade";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login_aluno" element={<LoginAluno />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/jogo" element={<JogoAndamento />} />
      <Route path="/" element={<Home />} />
      <Route path="/professor" element={<Dashboard />} />
      <Route path="/professor/turmas" element={<Turmas />} />
      <Route path="/professor/atividades" element={<Atividades />} />
      <Route path="/professor/atividades/criar" element={<CriarAtividade />} />
    </Routes>
  );
}

export default App;
