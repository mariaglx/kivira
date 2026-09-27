import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { AvatarPickerModal } from "../../components/aluno/AvatarPickerModal";
import { useConfiguracoesAluno } from "../../controllers/useConfiguracoesAluno";
import { Settings, Pencil } from "lucide-react";

function Aviso({ aviso }) {
  if (!aviso) return null;

  return (
    <p
      className={`text-sm font-semibold mt-3 ${
        aviso.tipo === "ok" ? "text-green-600" : "text-vermelho"
      }`}
    >
      {aviso.texto}
    </p>
  );
}

export function Configuracoes() {
  const { aluno, setAluno, carregandoAluno } = useOutletContext();
  const {
    carregando,
    apelido,
    setApelido,
    salvarApelido,
    salvandoApelido,
    avisoApelido,
    salvarAvatar,
    etapaSenha,
    senhaAtual,
    senhaNova,
    alternarSenhaAtual,
    alternarSenhaNova,
    apagarUltimoDaEtapaAtual,
    voltarParaSenhaAtual,
    salvarSenha,
    salvandoSenha,
    avisoSenha,
  } = useConfiguracoesAluno({ aluno, setAluno, carregandoAluno });

  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);

  if (carregando) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 min-w-0 px-8 py-8 pb-16">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          Meu Perfil & Ajustes
          <Settings size={22} />
        </h1>

        <div className="flex flex-col gap-6 max-w-3xl">
          {/* ───────── A. Avatar ───────── */}
          <section className="bg-branco rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-laranja/60 transition-colors flex flex-col items-center gap-4 text-center">
            <h2 className="text-lg font-extrabold self-start">Seu bichinho</h2>

            <div className="w-28 h-28 rounded-3xl bg-coral overflow-hidden flex items-center justify-center text-4xl font-black text-branco uppercase ring-4 ring-laranja shrink-0">
              {aluno?.avatar_url ? (
                <img
                  src={`/avatares/${aluno.avatar_url}`}
                  alt="Seu avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (aluno?.apelido || aluno?.nome_completo || "A").charAt(0)
              )}
            </div>

            <p className="text-sm text-azul/60">
              É ele que aparece do seu lado e pros seus colegas.
            </p>

            <button
              type="button"
              onClick={() => setModalAvatarAberto(true)}
              className="tatil bg-coral text-branco rounded-2xl px-6 py-3 font-bold"
            >
              Trocar meu Bichinho ✨
            </button>
          </section>

          {/* ───────── B. Apelido ───────── */}
          <section className="bg-branco rounded-3xl p-6 shadow-sm border border-cinza-claro/10">
            <h2 className="text-lg font-extrabold">Como você quer ser chamado</h2>
            <p className="text-sm text-azul/60">
              Esse é o nome que aparece no Kivira. Seu nome completo continua o
              mesmo.
            </p>

            <form
              onSubmit={salvarApelido}
              className="flex items-center gap-3 flex-wrap mt-4"
            >
              <div className="relative grow min-w-48">
                <Pencil
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-azul/40 pointer-events-none"
                />
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  maxLength={50}
                  placeholder={aluno?.nome_completo}
                  className="w-full bg-bege/40 border-2 border-cinza-claro focus:border-coral rounded-2xl pl-11 pr-4 py-3 text-azul font-semibold outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={salvandoApelido}
                className="tatil bg-coral text-branco rounded-2xl px-6 py-3 font-bold disabled:cursor-not-allowed"
              >
                {salvandoApelido ? "Salvando..." : "Salvar Nome"}
              </button>
            </form>

            <Aviso aviso={avisoApelido} />
          </section>

          {/* ───────── C. Senha de emojis (wizard) ───────── */}
          <section className="bg-branco rounded-3xl p-6 shadow-sm border border-cinza-claro/10">
            <h2 className="text-lg font-extrabold">Sua senha de emojis</h2>

            <div className="flex items-center gap-2 mt-3 mb-5">
              <span className={`h-2 flex-1 rounded-full ${etapaSenha >= 1 ? "bg-coral" : "bg-bege"}`} />
              <span className={`h-2 flex-1 rounded-full ${etapaSenha >= 2 ? "bg-coral" : "bg-bege"}`} />
            </div>

            {etapaSenha === 1 ? (
              <>
                <p className="text-sm text-azul/60 mb-4 text-center font-semibold">
                  Etapa 1 de 2 — Digite sua senha atual
                </p>
                <SeletorEmoji
                  selecionados={senhaAtual}
                  onAlternar={alternarSenhaAtual}
                  onApagar={apagarUltimoDaEtapaAtual}
                />
              </>
            ) : (
              <>
                <p className="text-sm text-azul/60 mb-4 text-center font-semibold">
                  Etapa 2 de 2 — Agora escolha sua NOVA senha de 3 emojis!
                </p>
                <SeletorEmoji
                  selecionados={senhaNova}
                  onAlternar={alternarSenhaNova}
                  onApagar={apagarUltimoDaEtapaAtual}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={voltarParaSenhaAtual}
                    className="text-sm font-bold text-azul/50 hover:text-azul px-2"
                  >
                    ← Trocar senha de agora
                  </button>
                  <button
                    type="button"
                    disabled={senhaNova.length !== 3 || salvandoSenha}
                    onClick={salvarSenha}
                    className="tatil flex-1 bg-coral text-branco rounded-2xl py-3 font-bold disabled:cursor-not-allowed"
                  >
                    {salvandoSenha ? "Trocando..." : "Trocar minha senha"}
                  </button>
                </div>
              </>
            )}

            <Aviso aviso={avisoSenha} />

            <p className="text-sm text-azul/50 mt-4 text-center">
              Esqueceu sua senha de emojis? Peça ajuda ao seu professor! 💡
            </p>
          </section>
        </div>
      </main>

      {modalAvatarAberto && (
        <AvatarPickerModal
          avatarAtual={aluno?.avatar_url}
          onFechar={() => setModalAvatarAberto(false)}
          onSalvar={salvarAvatar}
        />
      )}
    </>
  );
}

export default Configuracoes;
