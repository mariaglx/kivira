import { Link } from "react-router-dom";
import { Sidebar } from "../../components/aluno/Sidebar";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { useConfiguracoesAluno } from "../../controllers/useConfiguracoesAluno";
import { SettingsIcon } from "../../components/icons/settings";

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
  const {
    aluno,
    carregando,
    apelido,
    setApelido,
    salvarApelido,
    salvandoApelido,
    avisoApelido,
    senhaAtual,
    senhaNova,
    alternarSenhaAtual,
    alternarSenhaNova,
    salvarSenha,
    salvandoSenha,
    avisoSenha,
    sair,
  } = useConfiguracoesAluno();

  if (carregando) {
    return (
      <div className="min-h-screen bg-bege flex items-center justify-center">
        <p className="text-azul font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar aluno={aluno} onSair={sair} />

      <main className="flex-1 min-w-0 px-8 py-8 pb-16">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          Suas configurações
          <SettingsIcon size={22} isAnimated={false} />
        </h1>

        <div className="flex flex-col gap-6 max-w-3xl">
          {/* ───────── Avatar ───────── */}
          <section className="bg-branco rounded-3xl p-6 shadow-sm border-2 border-transparent hover:border-laranja/60 transition-colors flex items-center gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-coral overflow-hidden flex items-center justify-center text-2xl font-black text-branco uppercase ring-4 ring-laranja shrink-0">
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

            <div className="min-w-0 grow">
              <h2 className="text-lg font-extrabold">Seu bichinho</h2>
              <p className="text-sm text-azul/60">
                É ele que aparece do seu lado e pros seus colegas.
              </p>
            </div>

            <Link
              to="/aluno/escolher-avatar"
              className="tatil bg-coral text-branco rounded-2xl px-6 py-3 font-bold"
            >
              Trocar bichinho
            </Link>
          </section>

          {/* ───────── Apelido ───────── */}
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
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                maxLength={50}
                placeholder={aluno?.nome_completo}
                className="grow min-w-48 bg-bege/40 border-2 border-cinza-claro focus:border-coral rounded-2xl px-4 py-3 text-azul font-semibold outline-none transition"
              />
              <button
                type="submit"
                disabled={salvandoApelido}
                className="tatil bg-coral text-branco rounded-2xl px-6 py-3 font-bold disabled:cursor-not-allowed"
              >
                {salvandoApelido ? "Salvando..." : "Salvar"}
              </button>
            </form>

            <Aviso aviso={avisoApelido} />
          </section>

          {/* ───────── Senha de emojis ───────── */}
          <section className="bg-branco rounded-3xl p-6 shadow-sm border border-cinza-claro/10">
            <h2 className="text-lg font-extrabold">Sua senha de emojis</h2>
            <p className="text-sm text-azul/60">
              Pra trocar, escolha os 3 emojis de agora e depois os 3 novos.
            </p>

            <form onSubmit={salvarSenha} className="flex flex-col gap-6 mt-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-azul/50 mb-3">
                  Sua senha de agora
                </p>
                <SeletorEmoji
                  selecionados={senhaAtual}
                  onAlternar={alternarSenhaAtual}
                />
              </div>

              <div className="border-t border-cinza-claro pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-azul/50 mb-3">
                  Sua senha nova
                </p>
                <SeletorEmoji
                  selecionados={senhaNova}
                  onAlternar={alternarSenhaNova}
                />
              </div>

              <button
                type="submit"
                disabled={salvandoSenha}
                className="tatil bg-coral text-branco rounded-2xl py-3 font-bold disabled:cursor-not-allowed"
              >
                {salvandoSenha ? "Trocando..." : "Trocar minha senha"}
              </button>
            </form>

            <Aviso aviso={avisoSenha} />

            <p className="text-sm text-azul/50 mt-4">
              Esqueceu sua senha? Peça pro seu professor criar uma nova pra você.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Configuracoes;
