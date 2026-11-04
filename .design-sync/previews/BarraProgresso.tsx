import { BarraProgresso } from "kivira";

export const Continua = () => (
  <div className="p-4 max-w-sm flex flex-col gap-2">
    <div className="flex justify-between text-xs font-bold text-azul/60">
      <span>Nível 3</span>
      <span>140 / 200 XP</span>
    </div>
    <BarraProgresso valor={140} max={200} />
  </div>
);

export const Segmentos = () => (
  <div className="p-4 max-w-sm flex flex-col gap-2">
    <p className="rotulo">3 de 6 peças</p>
    <BarraProgresso valor={3} max={6} segmentos />
  </div>
);

export const Cores = () => (
  <div className="p-4 max-w-sm flex flex-col gap-4">
    <BarraProgresso valor={8} max={10} preenchimento="bg-verde" />
    <BarraProgresso valor={2} max={5} segmentos preenchimento="bg-laranja" trilha="bg-cinza-claro" />
    <BarraProgresso valor={5} max={5} preenchimento="bg-azul" />
  </div>
);
