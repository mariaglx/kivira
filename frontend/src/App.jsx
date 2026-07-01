import {Routes, Route} from 'react-router-dom'
import Login from './pages/auth/Login'
import Cadastro from './pages/auth/Cadastro'
import { JogoAndamento } from './pages/jogo/JogoAndamento';
import KiviraGame from './pages/jogo/KiviraGame';

function App() {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/jogo" element={<JogoAndamento />} />
        <Route path="/kivira" element={<KiviraGame />} />
      </Routes>
  )
}

export default App