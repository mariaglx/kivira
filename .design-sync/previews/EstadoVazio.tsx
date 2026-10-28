import { EstadoVazio, Button } from "kivira";

export const Padrao = () => (
  <div className="p-4 bg-bege max-w-md">
    <EstadoVazio>Nenhuma atividade publicada ainda.</EstadoVazio>
  </div>
);

export const ComAcao = () => (
  <div className="p-4 bg-bege max-w-md">
    <EstadoVazio acao={<Button tamanho="sm">Criar primeira turma</Button>}>
      Você ainda não tem turmas. Crie uma turma para convidar seus alunos.
    </EstadoVazio>
  </div>
);
