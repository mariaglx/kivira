import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";

// Helpers de animação compartilhados (professor, admin).
// O <MotionConfig reducedMotion="user"> no layout já corta os movimentos de quem prefere menos
// animação; aqui só o que o motion não cobre (contador, confete) checa isso.

// Fade + sobe ao montar. `delay` em segundos pra escalonar blocos soltos.
export function Entrada({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Grid/lista cujos <Item> entram em cascata.
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export function Lista({ children, className = "" }) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

// `elevar` dá o pulinho de hover/press nos cards clicáveis.
export function Item({ children, className = "", elevar = false, as = "div", ...props }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={item}
      {...(elevar && { whileHover: { y: -4 }, whileTap: { scale: 0.98 } })}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Número que sobe de 0 até `valor`.
export function Contador({ valor }) {
  const reduzir = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduzir) return;
    const anim = animate(0, valor, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => anim.stop();
  }, [valor, reduzir]);

  return <>{reduzir ? valor : n}</>;
}

// Modal com fundo e caixa animados. `aberto` controla a saída (AnimatePresence).
export function Modal({ aberto, onFechar, children, className = "max-w-sm" }) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`bg-branco rounded-3xl shadow-xl w-full p-6 ${className}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
