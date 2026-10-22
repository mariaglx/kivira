import { AvatarTrancado } from "./AvatarTrancado";

// "No nível X você libera: [bichinhos com cadeado]" — o gostinho do próximo prêmio.
// Some quando já não há nada pra liberar.
export function ProximosAvatares({ avatares, nivel }) {
  const proximos = avatares.filter((a) => a.nivel_minimo === nivel + 1);
  if (proximos.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-laranja/30">
      <p className="text-xs font-bold text-azul/70 mb-2">
        🎁 Chegue no nível {nivel + 1} e ganhe {proximos.length === 1 ? "esse bichinho" : "esses bichinhos"}:
      </p>
      <div className="flex gap-2 flex-wrap">
        {proximos.map((avatar) => (
          <AvatarTrancado key={avatar.id} avatar={avatar} className="w-12 h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
