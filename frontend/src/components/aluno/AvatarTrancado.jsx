import { Lock } from "lucide-react";

// Bichinho ainda bloqueado: imagem cinza e apagada, cadeado em cima e o nível
// que libera embaixo. Tamanho e raio vêm por `className`.
export function AvatarTrancado({ avatar, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-cinza-claro ${className}`}
      title={`${avatar.nome} — libera no nível ${avatar.nivel_minimo}`}
      aria-label={`${avatar.nome}, bloqueado até o nível ${avatar.nivel_minimo}`}
      role="img"
    >
      <img src={`/avatares/${avatar.arquivo}`} alt="" className="w-full h-full object-cover grayscale opacity-60" />
      <span className="absolute top-1 right-1 bg-azul text-branco rounded-full p-1 shadow-sm">
        <Lock size={10} strokeWidth={3} />
      </span>
      <span className="absolute bottom-1 inset-x-0 mx-auto w-fit text-[10px] font-black text-azul bg-branco/90 rounded-full px-1.5 leading-4">
        Nv {avatar.nivel_minimo}
      </span>
    </div>
  );
}
