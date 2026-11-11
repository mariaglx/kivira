import { useState } from "react";

// Copia um texto pra área de transferência e avisa por ~2s ("Copiado").
export function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // sem permissão de área de transferência: o código continua visível pra copiar à mão
    }
  };
  return { copiado, copiar };
}
