const EMOJIS_DISPONIVEIS = [
  "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐸", "🐵", "🦁", "🐯",
  "🍎", "🍌", "🍓", "🍕", "🍩", "🎈", "⚽", "🚀", "🌈", "⭐",
  "🌞", "🌙", "🎨", "🎵", "🚗", "🌸", "🍀", "🦋", "🐢", "🐬",
];

// Seletor de senha por emojis: o aluno escolhe (nessa ordem) até `max` emojis,
// que juntos formam a "senha" no backend (string concatenada dos emojis).
// `onApagar` é opcional — só aparece o botão de apagar o último emoji quando
// o chamador passa essa função (ex: o wizard de Configurações).
export function SeletorEmoji({ selecionados, onAlternar, onApagar, max = 3 }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center text-2xl ${
              selecionados[i]
                ? "border-coral bg-coral/10"
                : "border-dashed border-cinza-claro bg-bege/40"
            }`}
          >
            {selecionados[i] || ""}
          </div>
        ))}

        {onApagar && (
          <button
            type="button"
            onClick={onApagar}
            disabled={selecionados.length === 0}
            aria-label="Apagar último emoji"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-cinza-claro text-azul/50 hover:text-coral hover:border-coral flex items-center justify-center text-xl disabled:opacity-30 disabled:hover:text-azul/50 disabled:hover:border-cinza-claro transition-colors"
          >
            ⌫
          </button>
        )}
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
              // Com os 3 escolhidos, os demais continuam desabilitados mas com
              // a aparência normal: apagá-los fazia a grade parecer quebrada
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                selecionado
                  ? "bg-coral/20 ring-2 ring-coral scale-95"
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
