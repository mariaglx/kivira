import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAvatares } from "../../controllers/useAvatares";
import { useApi } from "../../controllers/useApi";
import { ProximosAvatares } from "../../components/aluno/ProximosAvatares";
import { Lista, Item } from "../../components/ui/Animacao";
import { progressoNivel } from "../../utils/xp";

// 6 por página: enche as 3 linhas do grid de 2 colunas sem o cartão crescer
// mais que o bloco de bichinhos logo abaixo.
const POR_PAGINA = 6;

// Aba de conquistas: os selinhos (vindos de /aluno/{id}/perfil, as mesmas
// regras que o cartão de perfil mostra pros colegas) e os próximos bichinhos
// a liberar, que antes ocupavam a trilha da home.
export function Conquistas() {
  const { aluno } = useOutletContext();
  const { avatares } = useAvatares();
  const { nivel } = progressoNivel(aluno?.xp_total);
  const { dados: perfil } = useApi(aluno?.id ? `/aluno/${aluno.id}/perfil` : null);

  const conquistas = perfil?.conquistas ?? [];
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil(conquistas.length / POR_PAGINA);
  // a lista chega depois do primeiro desenho; se a página guardada não existir
  // mais (catálogo encurtou), cai pra última válida em vez de mostrar vazio
  const paginaAtual = Math.min(pagina, Math.max(totalPaginas - 1, 0));
  const daPagina = conquistas.slice(
    paginaAtual * POR_PAGINA,
    paginaAtual * POR_PAGINA + POR_PAGINA
  );

  return (
    <main className="pagina pb-16">
      <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
        Minhas conquistas
        <span>🏆</span>
      </h1>

      <div className="cartao p-5 sm:p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-black text-azul">Conquistas</h2>
          {conquistas.length > 0 && (
            <span className="text-sm font-bold text-coral">
              {desbloqueadas} de {conquistas.length}
            </span>
          )}
        </div>

        {conquistas.length === 0 ? (
          <p className="text-azul/55 text-center py-4">
            Continue jogando, as conquistas estão a caminho. ✨
          </p>
        ) : (
          <>
          <Lista className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {daPagina.map((c) => (
              <Item
                key={c.codigo}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  c.desbloqueada
                    ? "bg-laranja-claro/30 ring-1 ring-coral/25"
                    : "bg-azul/5 opacity-50"
                }`}
              >
                <span className={`text-3xl leading-none ${c.desbloqueada ? "" : "grayscale"}`}>
                  {c.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-azul text-sm truncate">{c.nome}</p>
                  <p className="text-xs text-azul/60">{c.descricao}</p>
                </div>
              </Item>
            ))}
          </Lista>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-end gap-1 mt-4">
              <button
                type="button"
                onClick={() => setPagina(paginaAtual - 1)}
                disabled={paginaAtual === 0}
                aria-label="Página anterior"
                className="p-1 rounded-lg text-azul/60 hover:bg-azul/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-azul/45 tabular-nums">
                {paginaAtual + 1}/{totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas - 1}
                aria-label="Próxima página"
                className="p-1 rounded-lg text-azul/60 hover:bg-azul/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          </>
        )}
      </div>

      <ProximosAvatares
        avatares={avatares}
        nivel={nivel}
        className="cartao p-5 sm:p-6 mb-6"
        tamanhoAvatar="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl"
      />

      <div className="text-center">
        <Link
          to="/aluno/historico"
          className="tatil inline-flex items-center gap-2 bg-coral text-branco rounded-2xl px-6 py-3 font-bold"
        >
          Ver suas partidas jogadas
        </Link>
      </div>
    </main>
  );
}

export default Conquistas;
