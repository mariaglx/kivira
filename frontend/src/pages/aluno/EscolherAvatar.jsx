import { LogoKivira } from "../../components/LogoKivira";
import { Button } from "../../components/ui/Button";
import { AvatarGrid } from "../../components/aluno/AvatarGrid";
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

        <AvatarGrid
          categorias={categorias}
          categoriaAtiva={categoriaAtiva}
          onCategoriaChange={setCategoriaAtiva}
          avatares={avataresDaCategoria}
          selecionado={selecionado}
          onSelecionar={setSelecionado}
        />

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
