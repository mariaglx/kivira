import { Lista, Item } from "kivira";

export const CardClicavel = () => (
  <div className="p-4 bg-bege max-w-xs">
    <Lista>
      <Item elevar as="button" className="cartao p-4 w-full text-left">
        <p className="font-bold text-azul">Frações do dia a dia</p>
        <p className="text-xs text-azul/60">Matemática · 8 questões</p>
      </Item>
    </Lista>
  </div>
);

export const ItensDeLista = () => (
  <div className="p-4 max-w-xs">
    <Lista className="flex flex-col gap-2">
      {["Ana Beatriz", "Lucas Oliveira", "Marina Costa"].map((nome) => (
        <Item key={nome} className="cartao px-4 py-3 text-sm font-semibold text-azul">
          {nome}
        </Item>
      ))}
    </Lista>
  </div>
);
