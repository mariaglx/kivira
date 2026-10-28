import { Button } from "kivira";
import { Plus, X } from "lucide-react";

export const Variantes = () => (
  <div className="flex flex-wrap items-center gap-3 p-4">
    <Button>Começar jogo</Button>
    <Button variante="secundario">Ver turmas</Button>
    <Button variante="contorno">Editar atividade</Button>
    <Button variante="perigo">Excluir turma</Button>
    <Button variante="fantasma">Cancelar</Button>
  </div>
);

export const Tamanhos = () => (
  <div className="flex flex-wrap items-center gap-3 p-4">
    <Button tamanho="md">Salvar atividade</Button>
    <Button tamanho="sm" variante="secundario">
      <Plus size={14} className="mr-1" /> Nova questão
    </Button>
    <Button tamanho="icone" variante="fantasma" aria-label="Fechar">
      <X size={18} />
    </Button>
  </div>
);

export const Desabilitado = () => (
  <div className="flex flex-wrap items-center gap-3 p-4">
    <Button disabled>Enviar respostas</Button>
    <Button variante="secundario" disabled>
      Próxima fase
    </Button>
  </div>
);

export const LarguraTotal = () => (
  <div className="p-4 max-w-sm">
    <Button className="w-full">Entrar</Button>
  </div>
);
