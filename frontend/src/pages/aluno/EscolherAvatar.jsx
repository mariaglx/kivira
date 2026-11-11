import { LogoKivira } from "../../components/LogoKivira";
import { Button } from "../../components/ui/Button";
import { AvatarGrid } from "../../components/aluno/AvatarGrid";
import { useEscolherAvatar } from "../../controllers/useEscolherAvatar";
import { Alerta } from "../../components/ui/Alerta";

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
    nivelAluno,
  } = useEscolherAvatar();

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-6 sm:px-10 rounded-3xl shadow-lg w-full max-w-3xl">
        <div className="flex flex-col items-center gap-3 mb-6 text-center">
          <LogoKivira className="h-14 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-azul">
            Escolha seu personagem! ✨
          </h2>
          <p className="text-sm text-azul/80">
            Esse vai ser o seu ícone aqui no Kivira. Os bichinhos com cadeado você libera subindo de nível!
          </p>
        </div>

        {erro && (
          <Alerta className="mb-4 text-center justify-center">
            {erro}
          </Alerta>
        )}

        <AvatarGrid
          categorias={categorias}
          categoriaAtiva={categoriaAtiva}
          onCategoriaChange={setCategoriaAtiva}
          avatares={avataresDaCategoria}
          selecionado={selecionado}
          onSelecionar={setSelecionado}
          nivelAluno={nivelAluno}
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
