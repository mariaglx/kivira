import { AnimatePresence, MotionConfig, motion } from "motion/react";

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
    <MotionConfig reducedMotion="user">
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: max }).map((_, i) => (
          // Quando o emoji entra o quadradinho dá um pulo; o emoji "estoura" de dentro
          <motion.div
            key={i}
            animate={selecionados[i] ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl transition-colors ${
              selecionados[i]
                ? "border-coral bg-coral/10"
                : "border-dashed border-cinza-claro bg-bege/40"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {selecionados[i] && (
                <motion.span
                  key={selecionados[i]}
                  initial={{ scale: 0, rotate: -40, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {selecionados[i]}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {onApagar && (
          <button
            type="button"
            onClick={onApagar}
            disabled={selecionados.length === 0}
            aria-label="Apagar último emoji"
            className="w-14 h-14 rounded-2xl border-2 border-dashed border-cinza-claro text-azul/50 hover:text-coral hover:border-coral flex items-center justify-center text-xl disabled:opacity-30 disabled:hover:text-azul/50 disabled:hover:border-cinza-claro transition-colors"
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
            <motion.button
              key={emoji}
              whileHover={desabilitado ? undefined : { scale: 1.12, rotate: 4 }}
              whileTap={desabilitado ? undefined : { scale: 0.8 }}
              animate={{ scale: selecionado ? 0.95 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              type="button"
              onClick={() => onAlternar(emoji)}
              disabled={desabilitado}
              aria-pressed={selecionado}
              aria-label={`Emoji ${emoji}`}
              // Com os 3 escolhidos, os demais continuam desabilitados mas com
              // a aparência normal: apagá-los fazia a grade parecer quebrada
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-colors ${
                selecionado
                  ? "bg-coral/20 ring-2 ring-coral"
                  : "bg-bege/50 hover:bg-coral/10"
              }`}
            >
              {emoji}
            </motion.button>
          );
        })}
      </div>
    </div>
    </MotionConfig>
  );
}
