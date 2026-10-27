import { Carregando } from "kivira";

export const Embutido = () => (
  <div className="p-4 bg-bege max-w-md">
    <div className="cartao">
      <Carregando embutido texto="Carregando turmas..." />
    </div>
  </div>
);

export const Padrao = () => (
  <div className="flex min-h-64 bg-bege">
    <Carregando />
  </div>
);
