import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/Button";
import { baixarPng } from "../../utils/baixarPng";

// Cartão de gráfico do dashboard: título, botão de baixar PNG e a legenda
// própria do gráfico. A legenda é a mesma lista na tela e no PNG (ver
// utils/baixarPng), então as duas nunca ficam diferentes.
// `legenda`: [{ cor, rotulo }]; `arquivo`: nome do PNG sem extensão.
export function CartaoGrafico({ titulo, subtitulo, legenda, arquivo, children }) {
  const ref = useRef(null);
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    setBaixando(true);
    try {
      await baixarPng(ref.current.querySelector("svg.recharts-surface"), { titulo, legenda, arquivo });
    } finally {
      setBaixando(false);
    }
  }

  return (
    <section className="cartao rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
      <header className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-azul">{titulo}</h3>
          {subtitulo && <p className="text-xs text-azul/80">{subtitulo}</p>}
        </div>
        <Button variante="contorno" tamanho="sm" onClick={baixar} disabled={baixando}>
          <Download size={14} className="mr-1.5" />
          {baixando ? "Gerando..." : "Baixar PNG"}
        </Button>
      </header>

      <div ref={ref}>{children}</div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda">
        {legenda.map(({ cor, rotulo }) => (
          <li key={rotulo} className="flex items-center gap-1.5 text-xs font-semibold text-azul/80">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cor }} />
            {rotulo}
          </li>
        ))}
      </ul>
    </section>
  );
}
