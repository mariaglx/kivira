import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import {JogoAndamento} from "./pages/jogo/JogoAndamento";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/professor/Dashboard";
import { Turmas } from "./pages/professor/Turmas";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/jogo" element={<JogoAndamento />} />
      <Route path="/" element={<Home />} />
      <Route path="/professor/dashboard" element={<Dashboard />} />
      <Route path="/professor/turmas" element={<Turmas />} />
    </Routes>
  );
}

export default App;
