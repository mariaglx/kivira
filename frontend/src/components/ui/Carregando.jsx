import { Sparkles } from "lucide-react";

// Por padrão ocupa a página inteira (<main>); `embutido` é pra usar dentro de
// uma página que já tem seu <main>.
export function Carregando({ texto = "Carregando...", embutido = false }) {
  const Tag = embutido ? "div" : "main";
  return (
    <Tag className="flex-1 flex items-center justify-center py-16" role="status">
      <p className="text-azul font-bold text-lg flex items-center gap-2">
        <Sparkles className="text-coral animate-pulse" size={20} />
        {texto}
      </p>
    </Tag>
  );
}
