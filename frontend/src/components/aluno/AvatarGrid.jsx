import { AvatarTrancado } from "./AvatarTrancado";

// Grade de escolha de avatar (filtro por categoria + grid de bichinhos),
// extraída de EscolherAvatar.jsx pra ser reaproveitada também no modal de
// troca de bichinho em Configurações — mesmo visual nos dois lugares.
// Bichinho acima do `nivelAluno` aparece cinza, com cadeado e o nível que libera.
export function AvatarGrid({ categorias, categoriaAtiva, onCategoriaChange, avatares, selecionado, onSelecionar, nivelAluno = 1 }) {
  return (
    <>
      <div className="flex gap-2 mb-5 flex-wrap justify-center">
        {categorias.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoriaChange(cat)}
            className={`tatil px-4 py-2 rounded-full text-sm font-bold capitalize ${
              categoriaAtiva === cat
                ? "bg-coral text-branco"
                : "bg-bege/60 text-azul/60 [--sombra:transparent]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1">
        {avatares.map((item) =>
          item.nivel_minimo > nivelAluno ? (
            <AvatarTrancado key={item.id} avatar={item} className="aspect-square rounded-2xl" />
          ) : (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelecionar(item.arquivo)}
              aria-label={`Escolher ${item.nome}`}
              aria-pressed={selecionado === item.arquivo}
              className={`aspect-square rounded-2xl overflow-hidden transition-all ${
                selecionado === item.arquivo
                  ? "ring-4 ring-laranja scale-95 animate__animated animate__heartBeat"
                  : "ring-2 ring-transparent hover:ring-coral/40 hover:-translate-y-1"
              }`}
            >
              <img
                src={`/avatares/${item.arquivo}`}
                alt={item.nome}
                className="w-full h-full object-cover"
              />
            </button>
          ),
        )}
      </div>
    </>
  );
}
