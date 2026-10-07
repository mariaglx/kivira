import { Outlet } from "react-router-dom";
import { HeaderAluno } from "./HeaderAluno";
import { useAlunoAtual } from "../../controllers/useAlunoAtual";

// Layout compartilhado pelas rotas /aluno/* — o Header monta uma vez só e
// continua vivo entre as navegações (mesma ideia de antes com a Sidebar),
// então o /aluno/me só é buscado uma vez por sessão. Layout full-width, sem
// menu lateral: a navegação inteira (abas + avatar/ajustes) mora no próprio
// HeaderAluno.
//
// /aluno/escolher-avatar fica FORA desse layout de propósito: é uma tela cheia
// sem Header (mesmo estilo do Login/PrimeiroAcesso).
export function AlunoLayout() {
  const { aluno, setAluno, carregando } = useAlunoAtual();

  // pb-20 no celular: espaço pra barra de abas fixa no rodapé (ver HeaderAluno)
  return (
    <div className="min-h-screen bg-bege text-azul font-sans pb-20 sm:pb-0">
      <HeaderAluno aluno={aluno} />
      <Outlet context={{ aluno, setAluno, carregandoAluno: carregando }} />
    </div>
  );
}
