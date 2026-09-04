const EMOJIS_DISPONIVEIS = [
  "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯",
  "🍎", "🍌", "🍓", "🍕", "🍩", "🎈", "⚽", "🚀", "🌈", "⭐",
  "🌞", "🌙", "🎨", "🎵", "🚗", "🌸", "🍀", "🦋", "🐢", "🐬",
];

// Seletor de senha por emojis: o aluno escolhe (nessa ordem) até `max` emojis,
// que juntos formam a "senha" no backend (string concatenada dos emojis)
export function SeletorEmoji({ selecionados, onAlternar, max = 3 }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-3">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl ${
              selecionados[i]
                ? "border-coral bg-coral/10"
                : "border-dashed border-cinza-claro bg-bege/40"
            }`}
          >
            {selecionados[i] || ""}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {EMOJIS_DISPONIVEIS.map((emoji) => {
          const selecionado = selecionados.includes(emoji);
          const desabilitado = !selecionado && selecionados.length >= max;

          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onAlternar(emoji)}
              disabled={desabilitado}
              aria-pressed={selecionado}
              aria-label={`Emoji ${emoji}`}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                selecionado
                  ? "bg-coral/20 ring-2 ring-coral scale-95"
                  : desabilitado
                    ? "bg-bege/30 opacity-30 cursor-not-allowed"
                    : "bg-bege/50 hover:bg-coral/10 hover:scale-105"
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
