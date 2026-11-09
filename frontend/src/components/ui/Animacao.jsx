import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";

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

// Modal padrão do app: <dialog> nativo com as classes `modal` do daisyUI, nas
// cores do Kivira. O navegador já prende o Tab dentro dele, fecha no Esc e
// devolve o foco pro botão que abriu. Serve montado sempre (`aberto` controla)
// ou montado só quando aberto (`{x && <Modal aberto ...>}`). Sem `onFechar`,
// Esc e clique fora não fecham (ex: enquanto uma exclusão está em andamento).
export function Modal({ aberto, onFechar, children, className = "max-w-sm" }) {
  const ref = useRef(null);
  // Mantém o último conteúdo durante a animação de saída, senão a caixa
  // esvazia antes de sumir quando o pai faz `{item && ...}`
  const [ultimoConteudo, setUltimoConteudo] = useState(children);
  if (aberto && ultimoConteudo !== children) setUltimoConteudo(children);

  // Abre/fecha DEPOIS do commit: se fechar durante o commit, o React devolve o
  // foco pro botão de dentro do modal logo depois do navegador ter devolvido
  // pro botão que abriu
  useEffect(() => {
    const dialogo = ref.current;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  // Desmontou aberto (`{x && <Modal aberto>}`): fecha antes do <dialog> sair
  // da página, senão o navegador não devolve o foco
  useLayoutEffect(() => {
    const dialogo = ref.current;
    return () => dialogo.open && dialogo.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal bg-azul/40 backdrop-blur-sm"
      onCancel={(e) => {
        e.preventDefault();
        onFechar?.();
      }}
    >
      {/*: quando o conteúdo rola, o Chrome foca a própria caixa ao
          abrir e desenhava um contorno preto nela. Os campos de dentro mantêm o anel */}
      <div className={`modal-box bg-branco text-azul rounded-3xl shadow-xl p-6 outline-none ${className}`}>
        {aberto ? children : ultimoConteudo}
      </div>
      <div className="modal-backdrop">
        <button type="button" tabIndex={-1} aria-label="Fechar" onClick={() => onFechar?.()} />
      </div>
    </dialog>
  );
}
