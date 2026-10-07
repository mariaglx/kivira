import confetti from "canvas-confetti";

const CORES_CONFETE = ["#eb7561", "#eeb37f", "#214a5a", "#3fae7a"];

// Comemoração de sucesso (criar/salvar). Não dispara pra quem prefere menos movimento.
export function comemorar() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: CORES_CONFETE });
}
