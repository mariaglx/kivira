import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { limparCache } from "../../services/api";
import { alunoVisualizado, voltarParaAdmin } from "../../services/sessao";

// Faixa no topo enquanto o admin vê o app pela conta de uma criança
// (ver "Ver como aluno" em RelatorioAluno/Usuários). Some fora desse modo.
export function AvisoVisualizacao() {
  const navigate = useNavigate();
  const nome = alunoVisualizado();
  if (!nome) return null;

  const voltar = () => {
    const destino = voltarParaAdmin();
    limparCache();
    navigate(destino);
  };

  return (
    <div className="bg-azul text-branco px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm print:hidden">
      <span className="flex items-center gap-2">
        <Eye size={16} className="text-laranja shrink-0" />
        Você está vendo o Kivira como <strong>{nome}</strong> — só visualização.
      </span>
      <button type="button" onClick={voltar} className="font-bold text-laranja underline underline-offset-2 min-h-11 sm:min-h-0">
        Voltar ao admin
      </button>
    </div>
  );
}
