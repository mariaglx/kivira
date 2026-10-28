import { Entrada } from "kivira";

export const Blocos = () => (
  <div className="p-4 bg-bege flex flex-col gap-3 max-w-md">
    <Entrada>
      <h2 className="text-2xl font-black text-azul">Olá, professora Carla!</h2>
    </Entrada>
    <Entrada delay={0.1} className="cartao p-4">
      <p className="text-sm text-azul/70">Você tem 3 atividades esperando correção.</p>
    </Entrada>
  </div>
);
