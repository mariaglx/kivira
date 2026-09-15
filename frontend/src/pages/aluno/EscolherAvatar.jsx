import { LogoKivira } from "../../components/LogoKivira";
import { Button } from "../../components/ui/Button";
import { useEscolherAvatar } from "../../controllers/useEscolherAvatar";

export function EscolherAvatar() {
  const {
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    avataresDaCategoria,
    selecionado,
    setSelecionado,
    confirmar,
    carregando,
    erro,
  } = useEscolherAvatar();

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-6 sm:px-10 rounded-3xl shadow-lg w-full max-w-3xl">
        <div className="flex flex-col items-center gap-3 mb-6 text-center">
          <LogoKivira className="h-14 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-700">
            Escolha seu personagem! ✨
          </h2>
          <p className="text-sm text-azul/60">
            Esse vai ser o seu ícone aqui no Kivira.
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <div className="flex gap-2 mb-5 flex-wrap justify-center">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition ${
                categoriaAtiva === cat
                  ? "bg-coral text-branco"
                  : "bg-bege/60 text-azul/60 hover:bg-coral/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1">
          {avataresDaCategoria.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelecionado(item.arquivo)}
              aria-label={`Escolher ${item.nome}`}
              aria-pressed={selecionado === item.arquivo}
              className={`aspect-square rounded-2xl overflow-hidden transition-all ${
                selecionado === item.arquivo
                  ? "ring-4 ring-coral scale-95"
                  : "ring-2 ring-transparent hover:ring-coral/40 hover:scale-105"
              }`}
            >
              <img
                src={`/avatares/${item.arquivo}`}
                alt={item.nome}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Button
            type="button"
            disabled={!selecionado || carregando}
            onClick={confirmar}
            className="w-full"
          >
            {carregando ? "Salvando..." : "Confirmar personagem"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EscolherAvatar;
