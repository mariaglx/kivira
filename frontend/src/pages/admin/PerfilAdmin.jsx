import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { AvatarPickerModal } from "../../components/aluno/AvatarPickerModal";
import { apiRequest } from "../../services/api";

// Perfil do admin: por enquanto só o bichinho do menu — e pro admin todos vêm
// liberados (nivelAluno = Infinity tira os cadeados da grade).
export function PerfilAdmin() {
  const { perfilAdmin, avatarAdmin, setAvatarAdmin } = useOutletContext();
  const [escolhendo, setEscolhendo] = useState(false);

  const salvar = async (arquivo) => {
    await apiRequest("/admin/me", { method: "PATCH", data: { avatar_url: arquivo } });
    setAvatarAdmin(arquivo);
  };

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header>
        <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Perfil</h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-azul mt-1">Administrador</h2>
      </header>

      <section className="cartao rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 max-w-xl">
        <Avatar arquivo={avatarAdmin} nome="Administrador" className="w-24 h-24 rounded-3xl text-3xl ring-4 ring-laranja" />
        <div className="flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-azul">{perfilAdmin?.email}</p>
            <p className="text-sm text-azul/60">Como admin, todos os bichinhos estão liberados pra você.</p>
          </div>
          <Button tamanho="sm" onClick={() => setEscolhendo(true)}>
            {avatarAdmin ? "Trocar bichinho" : "Escolher bichinho"}
          </Button>
        </div>
      </section>

      {escolhendo && (
        <AvatarPickerModal
          avatarAtual={avatarAdmin}
          nivelAluno={Infinity}
          onFechar={() => setEscolhendo(false)}
          onSalvar={salvar}
        />
      )}
    </main>
  );
}

export default PerfilAdmin;
