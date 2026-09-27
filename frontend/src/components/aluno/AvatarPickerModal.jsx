import { useState } from "react";
import { Button } from "../ui/Button";
import { AvatarGrid } from "./AvatarGrid";
import { useAvatares } from "../../controllers/useAvatares";

// Modal de troca de bichinho usado em Configurações — mesma grade de
// EscolherAvatar.jsx (tela cheia do primeiro acesso), só que num overlay,
// seguindo o mesmo padrão de modal já usado no app (fixed inset-0 + backdrop).
export function AvatarPickerModal({ avatarAtual, onFechar, onSalvar }) {
  const { categorias, categoriaAtiva, setCategoriaAtiva, avataresDaCategoria, erro: erroAvatares } = useAvatares();
  const [selecionado, setSelecionado] = useState(avatarAtual || null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const confirmar = async () => {
    if (!selecionado) return;
    setErro("");
    setSalvando(true);
    try {
      await onSalvar(selecionado);
      onFechar();
    } catch (e) {
      setErro(e.message || "Não foi possível salvar seu avatar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-branco rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-xl animate__animated animate__zoomIn">
        <h2 className="text-xl font-black text-azul text-center mb-1">
          Escolha seu bichinho! ✨
        </h2>
        <p className="text-sm text-azul/60 text-center mb-5">
          Esse vai ser o seu ícone aqui no Kivira.
        </p>

        {(erro || erroAvatares) && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro || erroAvatares}
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

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onFechar}
            className="tatil flex-1 bg-bege text-azul/70 rounded-2xl py-3 font-bold [--sombra:transparent]"
          >
            Cancelar
          </button>
          <Button
            type="button"
            disabled={!selecionado || salvando}
            onClick={confirmar}
            className="flex-1"
          >
            {salvando ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
