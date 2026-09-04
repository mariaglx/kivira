import { useState, useEffect } from "react";
import { apiRequest } from "../../services/api";
import { useConfiguracoesProfessor } from "../../controllers/useConfiguracoesProfessor";
import { PencilIcon } from "../../components/icons/pencil";
import { Trash2Icon } from "../../components/icons/trash-2";
import { XIcon } from "../../components/icons/x";
import { UserIcon } from "../../components/icons/user";
import { SparklesIcon } from "../../components/icons/sparkles";
import { MapPinIcon } from "../../components/icons/map-pin";
import { MailIcon } from "../../components/icons/mail";
import { MessageSquareIcon } from "../../components/icons/message-square";
import { LockIcon } from "../../components/icons/lock";
import { KeyIcon } from "../../components/icons/key";
import { CheckIcon } from "../../components/icons/check";
import { TriangleAlertIcon } from "../../components/icons/triangle-alert";

export function Configuracoes() {
  const FRASE_CONFIRMACAO_EXCLUSAO = "apagar meus dados";

  const {
    professor,
    metricas,
    carregando,
    erro,
    salvando,
    salvarPerfil,
    salvarAvatar,
    alterarSenha,
    excluirConta,
  } = useConfiguracoesProfessor();

  const [modalAvatarAberto, setModalAvatarAberto] = useState(false);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [modalSegurancaAberto, setModalSegurancaAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [textoConfirmacaoExclusao, setTextoConfirmacaoExclusao] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  const exclusaoConfirmada =
    textoConfirmacaoExclusao.trim().toLowerCase() ===
    FRASE_CONFIRMACAO_EXCLUSAO;

  function abrirExclusao() {
    setTextoConfirmacaoExclusao("");
    setModalExclusaoAberto(true);
  }

  function fecharExclusao() {
    setModalExclusaoAberto(false);
    setTextoConfirmacaoExclusao("");
  }

  async function confirmarExclusao() {
    if (await excluirConta()) fecharExclusao();
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const estatisticas = [
    { rotulo: "Turmas", valor: metricas.total_turmas },
    { rotulo: "Alunos", valor: metricas.total_alunos },
    { rotulo: "Atividades", valor: metricas.total_atividades },
  ];

  const dadosPerfil = professor
    ? [
        { Icone: UserIcon, rotulo: "Nome completo", valor: professor.nome_completo },
        { Icone: SparklesIcon, rotulo: "Apelido", valor: professor.apelido },
        { Icone: MapPinIcon, rotulo: "Onde você dá aula", valor: professor.escola },
        { Icone: MailIcon, rotulo: "E-mail da conta", valor: professor.email },
      ]
    : [];

  const [avatares, setAvatares] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  useEffect(() => {
    apiRequest("/avatar/")
      .then((dados) => {
        setAvatares(dados);
        setCategoriaAtiva((atual) => atual ?? "todos");
      })
      .catch((erro) => console.error("Erro ao buscar avatares:", erro));
  }, []);

  const categorias = ["todos", ...new Set(avatares.map((a) => a.categoria))];
  const avataresDaCategoria =
    categoriaAtiva === "todos"
      ? avatares
      : avatares.filter((a) => a.categoria === categoriaAtiva);

  async function handleEscolherAvatar(arquivo) {
    await salvarAvatar(arquivo);
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.target).entries());
    if (await salvarPerfil(dados)) setModalPerfilAberto(false);
  }

  async function handleAlterarSenha(e) {
    e.preventDefault();
    setErroSenha("");
    const dados = Object.fromEntries(new FormData(e.target).entries());

    if (dados.senha_nova !== dados.confirmar_senha) {
      setErroSenha("As senhas novas não coincidem.");
      return;
    }
    if (dados.senha_nova.length < 6) {
      setErroSenha("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (
      await alterarSenha({
        senhaAtual: dados.senha_atual,
        senhaNova: dados.senha_nova,
      })
    ) {
      setModalSegurancaAberto(false);
      e.target.reset();
    } else {
      setErroSenha(erro);
    }
  }

  if (carregando || !professor) {
    return (
      <main className="flex-1 p-8">
        <p className="text-azul/60">Carregando...</p>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 p-8 flex flex-col gap-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">
              Configurações
            </h1>
            <h2 className="text-3xl font-extrabold text-azul mt-1">
              Configurações, {professor.apelido || professor.nome_completo}
            </h2>
            <p className="text-azul/70 text-sm mt-1">
              Atualize suas informações
            </p>
          </div>

          <div className="bg-branco px-4 py-2 rounded-xl border border-cinza-claro text-xs font-semibold text-azul shadow-sm">
            {dataHoje}
          </div>
        </header>

        {erro && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
            {erro}
          </div>
        )}

        {/* Lado Esquerdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-branco border border-cinza-claro rounded-3xl shadow-sm flex flex-col">
            {/* Avatar */}
            <div className="flex flex-col items-center px-6 pt-7">
              <div className="group relative">
                <div className="absolute -inset-2 rounded-3xl border-2 border-dashed border-azul/25 opacity-0 group-hover:opacity-100 transition"></div>

                <div className="w-20 h-20 rounded-2xl bg-coral overflow-hidden shadow-lg shadow-coral/40 transition group-hover:-rotate-3 group-hover:scale-[1.02]">
                  {professor.avatar_url && (
                    <img
                      src={`/avatares/${professor.avatar_url}`}
                      alt="Seu avatar"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Trocar foto de perfil"
                  onClick={() => setModalAvatarAberto(true)}
                  className="absolute -right-2 -bottom-2 w-8 h-8 rounded-xl bg-azul text-branco border-4 border-branco flex items-center justify-center text-xs hover:bg-azul/90 transition cursor-pointer"
                >
                  <PencilIcon size={14} isAnimated={false} />
                </button>
              </div>

              <p className="mt-4 font-extrabold text-azul text-center">
                {professor.nome_completo}
              </p>
              <p className="text-xs text-azul/60 text-center mt-0.5">
                {professor.escola}
              </p>
            </div>

            {/* Estatísticas */}
            <div className="px-6 mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-azul/50 mb-3">
                Estatísticas:
              </p>

              <div className="bg-bege/50 border border-bege rounded-2xl p-3 grid grid-cols-3 gap-2">
                {estatisticas.map((item) => (
                  <div
                    key={item.rotulo}
                    className="bg-branco rounded-xl py-3 text-center shadow-sm"
                  >
                    <span className="block text-2xl font-black text-coral leading-none tabular-nums">
                      {item.valor}
                    </span>
                    <span className="block text-[11px] font-bold uppercase text-azul/50 mt-1.5">
                      {item.rotulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluir conta */}
            <div className="mt-auto p-6 pt-5">
              <hr className="border-cinza-claro mb-4" />
              <button
                type="button"
                onClick={abrirExclusao}
                className="btn btn-ghost btn-sm w-full rounded-xl text-vermelho hover:bg-vermelho/10 transition"
              >
                <Trash2Icon size={16} isAnimated={false} />
                Excluir minha conta
              </button>
            </div>
          </div>

          {/* Lado Direito */}
          <div className="lg:col-span-2 bg-branco border border-cinza-claro rounded-3xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Seus dados
              </p>
              <button
                type="button"
                onClick={() => setModalPerfilAberto(true)}
                className="btn btn-primary btn-sm rounded-xl gap-2"
              >
                <PencilIcon size={14} isAnimated={false} />
                Editar perfil
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {dadosPerfil.map((item) => (
                <div key={item.rotulo} className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                    <item.Icone size={14} isAnimated={false} className="text-coral" />
                    {item.rotulo}
                  </span>
                  <span className="text-sm font-semibold text-azul">
                    {item.valor || "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Biografia */}
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                <MessageSquareIcon size={14} isAnimated={false} className="text-coral" />
                Conte um pouco de você
              </span>
              <p className="text-sm text-azul/80">
                {professor.biografia || "—"}
              </p>
            </div>

            {/* Senha */}
            <div className="pt-4 border-t border-cinza-claro flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-azul">Senha</p>
                <p className="text-xs text-azul/50 tracking-widest">••••••••</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErroSenha("");
                  setModalSegurancaAberto(true);
                }}
                className="btn btn-ghost btn-sm rounded-xl gap-2"
              >
                <LockIcon size={14} isAnimated={false} />
                Alterar senha
              </button>
            </div>
          </div>
        </div>
      </main>

      {modalAvatarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-azul/40 px-4">
          <div className="bg-branco rounded-3xl shadow-lg max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="font-extrabold text-azul">Escolher avatar</p>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setModalAvatarAberto(false)}
                className="btn btn-ghost btn-sm btn-circle text-azul/60"
              >
                <XIcon size={16} isAnimated={false} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                    categoriaAtiva === cat
                      ? "bg-coral text-branco"
                      : "bg-bege/60 text-azul/60 hover:bg-coral/15"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-72 overflow-y-auto">
              {avataresDaCategoria.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleEscolherAvatar(item.arquivo)}
                  aria-label={`Escolher ${item.nome}`}
                  aria-pressed={professor.avatar_url === item.arquivo}
                  className={`aspect-square rounded-xl overflow-hidden transition ${
                    professor.avatar_url === item.arquivo
                      ? "ring-4 ring-coral"
                      : "ring-2 ring-transparent hover:ring-coral/40"
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
          </div>
        </div>
      )}

      {modalPerfilAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-azul/40 px-4">
          <div className="bg-branco rounded-3xl shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <p className="font-extrabold text-azul">Editar perfil</p>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setModalPerfilAberto(false)}
                className="btn btn-ghost btn-sm btn-circle text-azul/60"
              >
                <XIcon size={16} isAnimated={false} />
              </button>
            </div>

            <form onSubmit={handleSalvarPerfil} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <UserIcon size={14} isAnimated={false} className="text-coral" />
                  Nome completo
                </label>
                <input
                  type="text"
                  name="nome_completo"
                  className="input w-full rounded-xl"
                  defaultValue={professor.nome_completo}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <SparklesIcon size={14} isAnimated={false} className="text-coral" />
                  Apelido
                </label>
                <input
                  type="text"
                  name="apelido"
                  className="input w-full rounded-xl"
                  defaultValue={professor.apelido}
                />
                <span className="text-xs text-azul/45">
                  É esse nome que aparece pros seus alunos
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <MapPinIcon size={14} isAnimated={false} className="text-coral" />
                  Onde você dá aula
                </label>
                <input
                  type="text"
                  name="escola"
                  className="input w-full rounded-xl"
                  defaultValue={professor.escola}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <MessageSquareIcon size={14} isAnimated={false} className="text-coral" />
                  Conte um pouco de você
                </label>
                <textarea
                  name="biografia"
                  rows={4}
                  className="textarea w-full rounded-xl"
                  defaultValue={professor.biografia}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="btn btn-primary rounded-xl px-8"
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSegurancaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-azul/40 px-4">
          <div className="bg-branco rounded-3xl shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <p className="font-extrabold text-azul">Alterar senha</p>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setModalSegurancaAberto(false)}
                className="btn btn-ghost btn-sm btn-circle text-azul/60"
              >
                <XIcon size={16} isAnimated={false} />
              </button>
            </div>

            <form onSubmit={handleAlterarSenha} className="flex flex-col gap-5">
              {erroSenha && (
                <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {erroSenha}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <MailIcon size={14} isAnimated={false} className="text-coral" />
                  E-mail da conta
                </label>
                <input
                  type="text"
                  className="input w-full rounded-xl"
                  defaultValue={professor.email}
                  disabled
                />
                <span className="text-xs text-azul/45">
                  Pra alterar o e-mail, fale com o suporte
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                  <LockIcon size={14} isAnimated={false} className="text-coral" />
                  Senha atual
                </label>
                <input
                  type="password"
                  name="senha_atual"
                  required
                  className="input w-full rounded-xl"
                  placeholder="A senha que você usa hoje"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                    <KeyIcon size={14} isAnimated={false} className="text-coral" />
                    Senha nova
                  </label>
                  <input
                    type="password"
                    name="senha_nova"
                    required
                    minLength={6}
                    className="input w-full rounded-xl"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-azul/50">
                    <CheckIcon size={14} isAnimated={false} className="text-coral" />
                    Repita a senha nova
                  </label>
                  <input
                    type="password"
                    name="confirmar_senha"
                    required
                    className="input w-full rounded-xl"
                    placeholder="As senhas devem ser iguais"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn btn-primary rounded-xl px-8">
                  Atualizar senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalExclusaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-azul/40 px-4">
          <div className="bg-branco rounded-3xl shadow-lg max-w-sm w-full p-6">
            <div className="w-12 h-12 rounded-2xl bg-vermelho/10 text-vermelho flex items-center justify-center text-xl mb-4">
              <TriangleAlertIcon size={20} isAnimated={false} />
            </div>
            <h3 className="text-lg font-extrabold text-azul">
              Excluir sua conta?
            </h3>
            <p className="text-sm text-azul/70 mt-2">
              Essa ação não pode ser desfeita. Suas turmas, atividades e dados
              de acesso serão apagados permanentemente.
            </p>

            <div className="flex flex-col gap-2 mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Digite{" "}
                <span className="text-vermelho">
                  "{FRASE_CONFIRMACAO_EXCLUSAO}"
                </span>{" "}
                para confirmar
              </label>
              <input
                type="text"
                autoFocus
                value={textoConfirmacaoExclusao}
                onChange={(e) => setTextoConfirmacaoExclusao(e.target.value)}
                placeholder={FRASE_CONFIRMACAO_EXCLUSAO}
                className="input w-full rounded-xl"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={fecharExclusao}
                className="btn btn-ghost rounded-xl flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!exclusaoConfirmada}
                onClick={confirmarExclusao}
                className={`btn rounded-xl flex-1 border-none text-branco transition ${
                  exclusaoConfirmada
                    ? "bg-vermelho hover:bg-vermelho/90"
                    : "bg-vermelho/30 text-branco/70 cursor-not-allowed hover:bg-vermelho/30"
                }`}
              >
                Excluir conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
