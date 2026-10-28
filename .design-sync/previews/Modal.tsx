import { Modal, Button } from "kivira";

// O transform faz o `fixed inset-0` do Modal ancorar nesta moldura em vez da janela.
export const Confirmacao = () => (
  <div className="relative bg-bege" style={{ height: 400, transform: "translateZ(0)" }}>
    <Modal aberto onFechar={() => {}}>
      <h3 className="text-xl font-black text-azul">Excluir turma?</h3>
      <p className="text-sm text-azul/70 mt-2">
        O 4º ano B e o progresso dos 21 alunos serão apagados. Essa ação não pode ser desfeita.
      </p>
      <div className="flex justify-end gap-2 mt-6">
        <Button variante="fantasma">Cancelar</Button>
        <Button variante="perigo">Excluir</Button>
      </div>
    </Modal>
  </div>
);
