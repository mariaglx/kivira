import { AvatarTrancado } from "./AvatarTrancado";

// "No nível X você libera: [bichinhos com cadeado]" — o gostinho do próximo prêmio.
// Some quando já não há nada pra liberar.
export function ProximosAvatares({ avatares, nivel, className = "", tamanhoAvatar = "w-12 h-12 rounded-xl" }) {
  const proximos = avatares.filter((a) => a.nivel_minimo === nivel + 1);
  if (proximos.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-sm font-bold text-azul/70 mb-3">
        🎁 Chegue no nível {nivel + 1} e ganhe {proximos.length === 1 ? "esse bichinho" : "esses bichinhos"}:
      </p>
      <div className="flex gap-3 flex-wrap">
        {proximos.map((avatar) => (
          <AvatarTrancado key={avatar.id} avatar={avatar} className={tamanhoAvatar} />
        ))}
      </div>
    </div>
  );
}
