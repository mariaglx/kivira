import { Avatar } from "kivira";

export const Iniciais = () => (
  <div className="flex items-center gap-3 p-4">
    <Avatar nome="Ana Beatriz" />
    <Avatar nome="Lucas" />
    <Avatar nome="Marina" />
    <Avatar nome="" />
  </div>
);

export const Tamanhos = () => (
  <div className="flex items-end gap-4 p-4">
    <Avatar nome="Pedro" className="w-8 h-8 text-xs rounded-lg" />
    <Avatar nome="Pedro" />
    <Avatar nome="Pedro" className="w-16 h-16 text-2xl rounded-2xl" />
    <Avatar nome="Pedro" className="w-24 h-24 text-4xl rounded-3xl ring-4 ring-laranja" />
  </div>
);

export const NaLista = () => (
  <div className="p-4 max-w-sm">
    <div className="cartao p-3 flex items-center gap-3">
      <Avatar nome="Júlia Santos" />
      <div className="min-w-0">
        <p className="font-bold text-azul truncate">Júlia Santos</p>
        <p className="text-xs text-azul/60">Nível 4 · 320 XP</p>
      </div>
    </div>
  </div>
);
