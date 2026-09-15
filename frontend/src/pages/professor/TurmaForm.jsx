import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTurmaForm } from "../../controllers/useTurmaForm";
import { Trash2Icon } from "../../components/icons/trash-2";

// Modal de "revelar credenciais" — usado tanto pra mostrar o aluno recém
// cadastrado quanto pra mostrar a senha nova depois de um reset. É a mesma
// UI nos dois casos, só muda o título/texto e o que fecha
function CredenciaisModal({ titulo, texto, username, senha, campoCopiado, onCopiar, onFechar }) {
  return (
    <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-branco rounded-3xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="font-extrabold text-azul">{titulo}</p>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onFechar}
            className="btn btn-ghost btn-sm btn-circle text-azul/60"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-azul/60 mb-4">{texto}</p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Usuário
            </span>
            <button
              type="button"
              onClick={() => onCopiar(username, "usuario")}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 transition-all"
            >
              <span className="font-mono font-extrabold tracking-wide text-azul text-sm">
                {username}
              </span>
              <span className="text-xs font-bold text-coral">
                {campoCopiado === "usuario" ? "Copiado!" : "Copiar"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Senha de primeiro acesso
            </span>
            <button
              type="button"
              onClick={() => onCopiar(senha, "senha")}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 transition-all"
            >
              <span className="font-mono font-extrabold tracking-widest text-azul text-lg">
                {senha}
              </span>
              <span className="text-xs font-bold text-coral">
                {campoCopiado === "senha" ? "Copiado!" : "Copiar"}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all mt-5 w-full"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}

export function TurmaForm() {
  const navigate = useNavigate();
  const {
    modoEdicao,
    formData,
    codigoAcesso,
    alunos,
    atividades,
    handleChange,
    handleSubmit,
    carregando,
    salvando,
    erro,
    modalAlunoAberto,
    abrirModalAluno,
    fecharModalAluno,
    nomeAluno,
    setNomeAluno,
    sobrenomeAluno,
    setSobrenomeAluno,
    cadastrandoAluno,
    erroCadastroAluno,
    alunoCriado,
    cadastrarAluno,
    removendoMatriculaId,
    alunoParaRemover,
    pedirRemocaoAluno,
    cancelarRemocaoAluno,
    confirmarRemocaoAluno,
    resetandoSenhaAlunoId,
    senhaResetada,
    resetarSenhaAluno,
    fecharSenhaResetada,
    erroAcaoAluno,
    fecharErroAcaoAluno,
    id,
  } = useTurmaForm();
  const [campoCopiado, setCampoCopiado] = useState(null);

  const copiar = async (texto, campo) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Alguns navegadores bloqueiam a Clipboard API fora de contexto focado — mostra o feedback mesmo assim
    }
    setCampoCopiado(campo);
    setTimeout(() => setCampoCopiado(null), 1500);
  };

  if (carregando) {
    return (
      <main className="flex-1 p-8">
        <p className="text-azul/60">Carregando...</p>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 p-8 flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link
            to="/professor/turmas"
            className="text-azul/50 hover:text-azul text-sm font-bold"
          >
            ← Turmas
          </Link>
        </header>

        <h2 className="text-2xl font-bold tracking-tight">
          {modoEdicao ? `Turma: ${formData.nome}` : "Nova Turma"}
        </h2>

        {erro && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl max-w-md">
            {erro}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* COLUNA ESQUERDA — dados da turma */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 shrink-0 sticky top-8"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Nome da turma
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: 3º Ano B"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Ano escolar
                </label>
                <input
                  type="text"
                  name="ano_escolar"
                  value={formData.ano_escolar}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 3º ano"
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                  Ano letivo
                </label>
                <input
                  type="number"
                  name="ano_letivo"
                  value={formData.ano_letivo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Uma breve descrição da turma (opcional)"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm resize-none"
              />
            </div>

            {modoEdicao && (
              <>
                <hr className="m-0 border-t border-cinza-claro/60" />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Código de acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => copiar(codigoAcesso, "codigoAcesso")}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 transition-all"
                  >
                    <span className="font-mono font-extrabold tracking-widest text-azul text-sm">
                      {codigoAcesso}
                    </span>
                    <span className="text-xs font-bold text-coral">
                      {campoCopiado === "codigoAcesso" ? "Copiado!" : "Copiar"}
                    </span>
                  </button>
                  <p className="text-[11px] text-azul/40">
                    Gerado automaticamente, não pode ser alterado.
                  </p>
                </div>
              </>
            )}

            {modoEdicao && (
              <label className="flex items-center gap-2 text-sm font-semibold text-azul cursor-pointer">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="checkbox checkbox-sm"
                />
                Turma ativa
              </label>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Link
                to="/professor/turmas"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-azul/60 hover:bg-azul/5 transition-all"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Criar turma"}
              </button>
            </div>
          </form>

          {/* COLUNA DIREITA — alunos e atividades da turma (só existem já criada) */}
          {modoEdicao && (
            <div className="flex-1 flex flex-col gap-5">
              {/* Sem borda de propósito: cinza-claro/10 é 90% transparente, então
                  ela não aparece como borda — só abre 1px do bg-branco do card
                  entre a sombra e o cabeçalho pêssego, virando um fio branco */}
              <div className="bg-branco rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-laranja/20 px-6 py-3.5">
                  <h3 className="font-bold text-azul uppercase tracking-wider text-xs">
                    Alunos ({alunos.length})
                  </h3>
                  <button
                    type="button"
                    onClick={abrirModalAluno}
                    className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-lg px-3 py-1.5 h-auto min-h-0 text-xs font-bold gap-1 shadow-sm transition-all active:scale-95"
                  >
                    + Adicionar aluno
                  </button>
                </div>
                <div className="px-6 py-2">
                  {alunos.length === 0 ? (
                    <p className="text-sm text-azul/60 py-3">
                      Nenhum aluno matriculado ainda. Compartilhe o código de acesso ou adicione direto por aqui.
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {alunos.map((aluno) => (
                        <li
                          key={aluno.matricula_id}
                          className="group flex items-center gap-3 py-2.5 border-b border-cinza-claro last:border-0"
                        >
                          {aluno.avatar_url && (
                            <img
                              src={`/avatares/${aluno.avatar_url}`}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <span className="text-sm font-semibold text-azul flex-1">
                            {aluno.apelido || aluno.nome_completo}
                          </span>
                          <button
                            type="button"
                            onClick={() => resetarSenhaAluno(aluno.aluno_id)}
                            disabled={resetandoSenhaAlunoId === aluno.aluno_id}
                            aria-label="Gerar nova senha de primeiro acesso"
                            title="Gerar nova senha de primeiro acesso"
                            className="opacity-0 group-hover:opacity-100 disabled:opacity-100 transition-opacity text-azul/30 hover:text-coral w-6 h-6 flex items-center justify-center shrink-0"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => pedirRemocaoAluno(aluno)}
                            disabled={removendoMatriculaId === aluno.matricula_id}
                            aria-label="Remover aluno da turma"
                            title="Remover da turma"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-azul/30 hover:text-red-500 w-6 h-6 flex items-center justify-center text-lg leading-none shrink-0"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Sem borda de propósito: cinza-claro/10 é 90% transparente, então
                  ela não aparece como borda — só abre 1px do bg-branco do card
                  entre a sombra e o cabeçalho pêssego, virando um fio branco */}
              <div className="bg-branco rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-laranja/20 px-6 py-3.5">
                  <h3 className="font-bold text-azul uppercase tracking-wider text-xs">
                    Atividades ({atividades.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate("/professor/atividades/criar", { state: { turmaIdPadrao: id } })}
                    className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-lg px-3 py-1.5 h-auto min-h-0 text-xs font-bold gap-1 shadow-sm transition-all active:scale-95"
                  >
                    + Nova atividade
                  </button>
                </div>
                <div className="px-6 py-2">
                  {atividades.length === 0 ? (
                    <p className="text-sm text-azul/60 py-3">
                      Nenhuma atividade atribuída a essa turma ainda.
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {atividades.map((atividade) => (
                        <li
                          key={atividade.id}
                          className="flex items-center justify-between py-2.5 border-b border-cinza-claro last:border-0"
                        >
                          <span className="text-sm font-semibold text-azul">
                            {atividade.titulo}
                          </span>
                          <span
                            className={`badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              atividade.publicado
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {atividade.publicado ? "Publicada" : "Rascunho"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {modalAlunoAberto && !alunoCriado && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-branco rounded-3xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="font-extrabold text-azul">Adicionar aluno</p>
              <button
                type="button"
                aria-label="Fechar"
                onClick={fecharModalAluno}
                className="btn btn-ghost btn-sm btn-circle text-azul/60"
              >
                ×
              </button>
            </div>

            <form onSubmit={cadastrarAluno} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={nomeAluno}
                    onChange={(e) => setNomeAluno(e.target.value)}
                    placeholder="Ex: João"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={sobrenomeAluno}
                    onChange={(e) => setSobrenomeAluno(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
                  />
                </div>
              </div>

              <p className="text-[11px] text-azul/40">
                O usuário e a senha de primeiro acesso são gerados automaticamente pelo sistema.
              </p>

              {erroCadastroAluno && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  <span>{erroCadastroAluno}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cadastrandoAluno}
                className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all disabled:opacity-60"
              >
                {cadastrandoAluno ? "Cadastrando..." : "Cadastrar aluno"}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalAlunoAberto && alunoCriado && (
        <CredenciaisModal
          titulo="Aluno cadastrado!"
          texto="Anote ou copie agora — a senha de primeiro acesso não aparece de novo depois de fechar essa janela."
          username={alunoCriado.username}
          senha={alunoCriado.senha_temporaria}
          campoCopiado={campoCopiado}
          onCopiar={copiar}
          onFechar={fecharModalAluno}
        />
      )}

      {senhaResetada && (
        <CredenciaisModal
          titulo="Nova senha gerada!"
          texto="A senha anterior parou de valer. Anote ou copie agora — essa senha não aparece de novo depois de fechar essa janela."
          username={senhaResetada.username}
          senha={senhaResetada.senha_temporaria}
          campoCopiado={campoCopiado}
          onCopiar={copiar}
          onFechar={fecharSenhaResetada}
        />
      )}

      {/* Confirmação de remoção — substitui o window.confirm() nativo, que não
          tinha espaço pra explicar que a conta do aluno não é apagada */}
      {alunoParaRemover && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-branco rounded-3xl shadow-xl max-w-sm w-full p-6 flex flex-col items-center text-center animate__animated animate__zoomIn">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
              <Trash2Icon size={28} isAnimated={false} />
            </div>

            <h3 className="text-xl font-extrabold text-azul mt-3">
              Remover da turma?
            </h3>
            <p className="text-sm text-azul/60 mt-2">
              <strong className="text-azul">{alunoParaRemover.nome}</strong> sai
              da lista e deixa de ver as atividades desta turma.
            </p>

            <p className="text-xs text-azul/60 leading-relaxed bg-bege/60 rounded-xl px-4 py-3 mt-4">
              A conta dele <strong className="text-azul">não é apagada</strong> —
              ele continua nas outras turmas em que está matriculado, e pode ser
              adicionado de volta a esta depois.
            </p>

            <div className="flex gap-3 w-full mt-5">
              <button
                type="button"
                onClick={cancelarRemocaoAluno}
                className="btn flex-1 bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl px-4 py-2.5 font-bold text-sm transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRemocaoAluno}
                disabled={removendoMatriculaId === alunoParaRemover.matricula_id}
                className="btn flex-1 bg-red-500 hover:bg-red-500/90 text-branco border-none rounded-xl px-4 py-2.5 font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removendoMatriculaId === alunoParaRemover.matricula_id
                  ? "Removendo..."
                  : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro — mesmo padrão da tela de criar atividade */}
      {erroAcaoAluno && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-branco rounded-3xl p-8 shadow-xl flex flex-col items-center gap-3 max-w-sm text-center animate__animated animate__zoomIn">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              Ops, algo deu errado
            </h3>
            <p className="text-sm text-azul/60">{erroAcaoAluno}</p>
            <button
              type="button"
              onClick={fecharErroAcaoAluno}
              className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl px-6 py-2.5 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 mt-2"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TurmaForm;
