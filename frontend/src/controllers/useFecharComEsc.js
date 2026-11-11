import { useEffect } from "react";

// Menu/popover aberto fecha no Esc e devolve o foco pro botão que abriu
// (senão o foco cai no <body> quando o item focado some junto com o menu).
// Modais não precisam: o <dialog> do componente Modal já faz isso.
export function useFecharComEsc(aberto, fechar, refBotao) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => {
      if (e.key !== "Escape") return;
      fechar();
      refBotao?.current?.focus();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar, refBotao]);
}
