import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTurmaForm } from "../../controllers/useTurmaForm";
import { StarIcon } from "../../components/icons/star";
import { Power, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Animacao";
import { Input } from "../../components/ui/Input";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Carregando } from "../../components/ui/Carregando";
import { Alerta } from "../../components/ui/Alerta";

// Modal de "revelar credenciais" — usado pra mostrar a senha nova depois de
// um reset de senha de aluno (o cadastro em si mostra a credencial numa
// tabela própria, porque pode ser mais de um aluno de uma vez)
function CredenciaisModal({
  titulo,
  texto,
  username,
  senha,
  campoCopiado,
  onCopiar,
  onFechar,
  incluirImpressao,
  onToggleImpressao,
}) {
  return (
    <Modal aberto onFechar={onFechar} className="max-w-sm">
        <div className="flex items-start justify-between mb-4">
          <p className="font-extrabold text-azul">{titulo}</p>
          <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={onFechar}>
            ×
          </Button>
        </div>

        <p className="text-sm text-azul/80 mb-4">{texto}</p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="rotulo">
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
              <span className="text-xs font-bold text-coral-texto">
                {campoCopiado === "usuario" ? "Copiado!" : "Copiar"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="rotulo">
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
              <span className="text-xs font-bold text-coral-texto">
                {campoCopiado === "senha" ? "Copiado!" : "Copiar"}
              </span>
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-azul cursor-pointer mt-5">
          <input
            type="checkbox"
            checked={incluirImpressao}
            onChange={(e) => onToggleImpressao(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          Adicionar à impressão da turma
        </label>

        <Button onClick={onFechar} className="px-6 py-2.5 text-sm mt-3 w-full">
          Concluir
        </Button>
    </Modal>
  );
}

export function TurmaForm() {
  const navigate = useNavigate();
  const {
    escolherProfessor,
    professores,
    professorId,
    setProfessorId,
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
    abaModalAluno,
    setAbaModalAluno,
    linhasCadastro,
    alterarLinhaCadastro,
    adicionarLinhaCadastro,
    colarLinhasCadastro,
    importarArquivoDeAlunos,
    lendoArquivo,
    removerLinhaCadastro,
    itensLote,
    cadastrandoLote,
    erroCadastroLote,
    resultadoLote,
    cadastrarAlunosLote,
    reiniciarCadastroLote,
    buscaAlunoExistente,
    setBuscaAlunoExistente,
    resultadosBusca,
    buscandoAlunoExistente,
    matriculandoAlunoId,
    erroMatricularExistente,
    matricularAlunoExistente,
    removendoMatriculaId,
    alunoParaRemover,
    pedirRemocaoAluno,
    cancelarRemocaoAluno,
    confirmarRemocaoAluno,
    resetandoSenhaAlunoId,
    senhaResetada,
    resetarSenhaAluno,
    alternandoContaAlunoId,
    alternarContaAluno,
    fecharSenhaResetada,
    erroAcaoAluno,
    fecharErroAcaoAluno,
    id,
    filaImpressao,
    adicionarNaFilaImpressao,
    limparFilaImpressao,
    houveAlteracao,
    alternarAtivoTurma,
    alternandoAtivo,
    desfazerAlteracoes,
    rankingAlunos,
    totalAtividadesPublicadas,
  } = useTurmaForm();
  const [campoCopiado, setCampoCopiado] = useState(null);
  const [rankingAberto, setRankingAberto] = useState(false);

  // Pra avisar de cara, na busca de "aluno já matriculado", quem já está
  // NESTA turma — sem isso o professor só descobre depois de clicar e levar
  // o erro do backend
  const idsAlunosNaTurmaAtual = new Set(alunos.map((aluno) => aluno.aluno_id));

  // Foco pula pro nome da linha nova sempre que "+" adiciona uma (e quando o
  // modal abre com a primeira linha) — assim dá pra digitar a turma inteira
  // sem tocar no mouse
  const refUltimoNome = useRef(null);
  useEffect(() => {
    refUltimoNome.current?.focus();
  }, [linhasCadastro.length]);

  // Arrastar um arquivo de lista pra cima do modal, ou escolher pelo botão
  const refArquivoAlunos = useRef(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);

  // Enquanto ninguém pontuou, a ordem do ranking é só alfabética — numerar as
  // posições aí daria a impressão de uma classificação que não existe ainda
  const temXp = rankingAlunos.some((aluno) => aluno.xp_total > 0);

  // Toda vez que um reset de senha acontece, o checkbox volta a vir marcado.
  // Comparar com a credencial anterior "durante a renderização" (em vez de um
  // useEffect) é o padrão que o React recomenda pra ajustar estado a partir de
  // uma prop/valor que mudou — evita o aviso de cascata de re-renders.
  const [incluirNaImpressao, setIncluirNaImpressao] = useState(true);
  const [ultimaCredencialVista, setUltimaCredencialVista] = useState(null);
  if (senhaResetada && senhaResetada !== ultimaCredencialVista) {
    setUltimaCredencialVista(senhaResetada);
    setIncluirNaImpressao(true);
  }

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
      <Carregando />
    );
  }

  return (
    <>
      <main className="pagina flex flex-col gap-6 print:hidden">
        <header className="flex items-center gap-3">
          <Link
            to="/professor/turmas"
            className="alvo-toque text-azul/80 hover:text-azul text-sm font-bold"
          >
            ← Turmas
          </Link>
        </header>

        {/* Todas as ações sobre a turma inteira moram no cabeçalho, longe dos
            campos: o
            salvar/cancelar ficam sempre no mesmo canto, fácil de achar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight min-w-0 break-words">
            {modoEdicao ? `Turma: ${formData.nome}` : "Nova Turma"}
          </h2>

          <div className="flex items-center gap-2 shrink-0">
            {modoEdicao && (
              <Button
                variante="fantasma"
                tamanho="sm"
                onClick={alternarAtivoTurma}
                disabled={alternandoAtivo}
                className={`gap-2 ${formData.ativo ? "text-vermelho hover:bg-vermelho/10" : ""}`}
              >
                <Power size={16} />
                {formData.ativo ? "Desativar turma" : "Reativar turma"}
              </Button>
            )}

            {/* Só aparecem quando há alteração pendente nos campos da turma.
                Mexer em alunos não conta: aquilo já vai pro banco na hora. */}
            {houveAlteracao && (
              <>
                <Button
                  variante="fantasma"
                  tamanho="sm"
                  disabled={salvando}
                  onClick={() =>
                    modoEdicao ? desfazerAlteracoes() : navigate("/professor/turmas")
                  }
                >
                  Cancelar
                </Button>
                {/* form="form-turma" liga o botão ao formulário mesmo estando
                    fora dele — sem isso o submit nativo (e a validação dos
                    campos required) deixaria de funcionar */}
                <Button type="submit" form="form-turma" disabled={salvando} className="px-4 py-2 text-sm">
                  {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Criar turma"}
                </Button>
              </>
            )}
          </div>
        </div>

        {erro && (
          <Alerta className="max-w-md">
            {erro}
          </Alerta>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
          {/* COLUNA ESQUERDA — dados da turma */}
          <form
            id="form-turma"
            onSubmit={handleSubmit}
            className="w-full lg:max-w-sm bg-branco rounded-2xl p-5 sm:p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 shrink-0 lg:sticky lg:top-8"
          >
            {escolherProfessor && (
              <SelectCustom
                label="Professor responsável"
                name="professor_id"
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                options={professores.map((p) => ({ value: String(p.id), label: p.nome_completo }))}
                placeholder="Escolha o professor"
              />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="campo-nome-da-turma" className="rotulo">
                Nome da turma
              </label>
              <Input id="campo-nome-da-turma"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: 3º Ano B"
                className="w-full py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-ano-escolar" className="rotulo">
                  Ano escolar
                </label>
                <Input id="campo-ano-escolar"
                  type="text"
                  name="ano_escolar"
                  value={formData.ano_escolar}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 3º ano"
                  className="w-full py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="campo-ano-letivo" className="rotulo">
                  Ano letivo
                </label>
                <Input id="campo-ano-letivo"
                  type="number"
                  name="ano_letivo"
                  value={formData.ano_letivo}
                  onChange={handleChange}
                  required
                  className="w-full py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="campo-descricao" className="rotulo">
                Descrição
              </label>
              <textarea id="campo-descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Uma breve descrição da turma (opcional)"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder:text-azul/75 shadow-sm transition-all text-sm resize-none"
              />
            </div>

            {modoEdicao && (
              <>
                <hr className="m-0 border-t border-cinza-claro/60" />

                <div className="flex flex-col gap-1.5">
                  <span className="rotulo">
                    Código de acesso
                  </span>
                  <button
                    type="button"
                    onClick={() => copiar(codigoAcesso, "codigoAcesso")}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-bege/40 hover:bg-bege/70 transition-all"
                  >
                    <span className="font-mono font-extrabold tracking-widest text-azul text-sm">
                      {codigoAcesso}
                    </span>
                    <span className="text-xs font-bold text-coral-texto">
                      {campoCopiado === "codigoAcesso" ? "Copiado!" : "Copiar"}
                    </span>
                  </button>
                  <p className="text-xs text-azul/80">
                    Gerado automaticamente, não pode ser alterado.
                  </p>
                </div>
              </>
            )}

          </form>

          {/* COLUNA DIREITA — alunos e atividades da turma (só existem já criada) */}
          {modoEdicao && (
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              {/* Sem borda de propósito: cinza-claro/10 é 90% transparente, então
                  ela não aparece como borda — só abre 1px do bg-branco do card
                  entre a sombra e o cabeçalho pêssego, virando um fio branco */}
              <div className="bg-branco rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-laranja/20 px-6 py-3.5">
                  <h3 className="font-bold text-azul uppercase tracking-wider text-xs">
                    Alunos ({alunos.length})
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {filaImpressao.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button variante="fantasma" tamanho="sm" onClick={limparFilaImpressao}>
                          Limpar
                        </Button>
                        <Button variante="contorno" tamanho="sm" onClick={() => window.print()}>
                          Imprimir Turma ({filaImpressao.length})
                        </Button>
                      </div>
                    )}
                    {/* Contorno (fundo branco) como o "Imprimir Turma": o ouro-bg
                        se confundia com o bege da faixa no desktop */}
                    <Button
                      variante="contorno"
                      tamanho="sm"
                      onClick={() => setRankingAberto(true)}
                      className="gap-1"
                    >
                      <StarIcon size={13} isAnimated={false} className="text-ouro-fg" />
                      Ver ranking
                    </Button>
                    <Button tamanho="sm" onClick={abrirModalAluno}>
                      + Adicionar aluno
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-2">
                  {alunos.length === 0 ? (
                    <p className="text-sm text-azul/80 py-3">
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
                          <span className="text-sm font-semibold text-azul flex-1 flex items-center gap-2 min-w-0">
                            <Link to={`/professor/turmas/${id}/alunos/${aluno.aluno_id}`} className="truncate py-3 -my-3 hover:text-coral-texto hover:underline underline-offset-2">
                              {aluno.apelido || aluno.nome_completo}
                            </Link>
                            {aluno.matricula && (
                              <span className="text-xs font-bold text-azul/80 bg-cinza-claro px-1.5 py-0.5 rounded shrink-0">
                                {aluno.matricula}
                              </span>
                            )}
                            {aluno.conta_ativa === false && (
                              <span className="text-xs font-bold text-vermelho bg-vermelho/10 px-1.5 py-0.5 rounded shrink-0">
                                Desativado
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => alternarContaAluno(aluno)}
                            disabled={alternandoContaAlunoId === aluno.aluno_id}
                            aria-label={aluno.conta_ativa === false ? "Reativar conta do aluno" : "Desativar conta do aluno"}
                            title={aluno.conta_ativa === false ? "Reativar conta" : "Desativar conta (o aluno não entra mais)"}
                            className={`${aluno.conta_ativa === false ? "" : "[@media(hover:hover)]:opacity-0"} group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-100 transition-opacity text-azul/60 hover:text-coral-texto alvo-toque w-8 h-8 flex items-center justify-center shrink-0`}
                          >
                            {aluno.conta_ativa === false ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                          <button
                            type="button"
                            // aria-disabled em vez de disabled: botão desabilitado perde o
                            // foco, e aí o modal da senha não tem pra onde devolver ao fechar
                            onClick={() => resetandoSenhaAlunoId !== aluno.aluno_id && resetarSenhaAluno(aluno.aluno_id)}
                            aria-disabled={resetandoSenhaAlunoId === aluno.aluno_id}
                            aria-label="Gerar nova senha de primeiro acesso"
                            title="Gerar nova senha de primeiro acesso"
                            className="[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 aria-disabled:opacity-100 transition-opacity text-azul/60 hover:text-coral-texto alvo-toque w-8 h-8 flex items-center justify-center shrink-0"
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
                            className="[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity text-azul/60 hover:text-vermelho alvo-toque w-8 h-8 flex items-center justify-center text-lg leading-none shrink-0"
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
                  <Button
                    tamanho="sm"
                    onClick={() => navigate("/professor/atividades/criar", { state: { turmaIdPadrao: id } })}
                  >
                    + Nova atividade
                  </Button>
                </div>
                <div className="px-6 py-2">
                  {atividades.length === 0 ? (
                    <p className="text-sm text-azul/80 py-3">
                      Nenhuma atividade atribuída a essa turma ainda.
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {atividades.map((atividade) => (
                        <li
                          key={atividade.id}
                          className="flex items-center gap-3 py-2.5 border-b border-cinza-claro last:border-0"
                        >
                          {atividade.imagem_atividade_url ? (
                            <img
                              src={atividade.imagem_atividade_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-bege shrink-0"
                            />
                          ) : (
                            // Quadrado tracejado no lugar da imagem: sem ele, os
                            // títulos das atividades sem imagem começariam num x
                            // diferente e a lista ficaria desalinhada
                            <div className="w-10 h-10 rounded-lg bg-bege border border-dashed border-cinza-claro shrink-0" />
                          )}

                          <span className="text-sm font-semibold text-azul grow min-w-0 truncate">
                            {atividade.titulo}
                          </span>
                          <span
                            className={`badge border-none rounded-md px-2 py-0.5 text-xs font-bold ${
                              atividade.publicado
                                ? "bg-verde/10 text-verde-texto"
                                : "bg-cinza-claro text-azul/80"
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

      {/* Só existe pro navegador imprimir — some da tela normal (hidden) e só
          aparece dentro do @media print (print:block). A borda tracejada dá a
          linha de corte que o professor pediu pra recortar os cartões.
          2 por linha, fluindo pela página normalmente; justify-items-center +
          max-w no cartão evita que ele estique até a borda da coluna, dando o
          respiro/centralização dentro de cada célula da grade. */}
      <div className="hidden print:block w-full p-10">
        <div className="grid grid-cols-2 gap-8 justify-items-center">
          {filaImpressao.map((item, indice) => (
            <div
              key={`${item.username}-${indice}`}
              className="border-2 border-dashed border-cinza-claro rounded-xl p-6 w-full max-w-sm text-center break-inside-avoid"
            >
              <p className="text-xl font-bold text-azul">
                {formData.nome}
              </p>
              <p className="text-base font-semibold text-azul mt-3">
                {item.username}
              </p>
              <p className="text-4xl font-extrabold tracking-[0.3em] text-azul mt-2">
                {item.senha_temporaria}
              </p>
            </div>
          ))}
        </div>
      </div>

      {modalAlunoAberto && (
        <Modal aberto onFechar={fecharModalAluno} className="max-w-xl">
            <div className="flex items-start justify-between mb-4">
              <p className="font-extrabold text-azul">Adicionar aluno</p>
              <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={fecharModalAluno}>
                ×
              </Button>
            </div>

            {/* Duas formas de matricular: preencher a lista de linhas (1
                aluno ou 30 é o mesmo fluxo, "+" adiciona a próxima) ou puxar
                um aluno que já é do professor em outra turma */}
            <div className="flex gap-1 bg-cinza-claro p-1 rounded-xl mb-5">
              {[
                { chave: "cadastrar", rotulo: "Cadastrar" },
                { chave: "existente", rotulo: "Já cadastrado" },
              ].map((aba) => (
                <button
                  key={aba.chave}
                  type="button"
                  onClick={() => setAbaModalAluno(aba.chave)}
                  className={`flex-1 text-xs font-extrabold px-2 py-2 rounded-lg transition-all ${
                    abaModalAluno === aba.chave
                      ? "bg-branco text-coral-texto shadow-sm"
                      : "text-azul/80 hover:text-azul"
                  }`}
                >
                  {aba.rotulo}
                </button>
              ))}
            </div>

            {abaModalAluno === "cadastrar" && (
              resultadoLote ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 bg-verde/10 rounded-xl px-3.5 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-verde text-branco text-xs font-black flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <span className="text-[12.5px] font-bold text-azul">
                      {resultadoLote.length} aluno{resultadoLote.length === 1 ? "" : "s"} cadastrado{resultadoLote.length === 1 ? "" : "s"} e matriculado{resultadoLote.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-cinza-claro/60 rounded-xl">
                    {resultadoLote.map((aluno, indice) => (
                      <div
                        key={`${aluno.username}-${indice}`}
                        className="flex items-center gap-2 px-3 py-2 border-b border-cinza-claro/40 last:border-0 text-xs"
                      >
                        <span className="font-bold text-azul flex-1 truncate flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{aluno.nome_completo}</span>
                          {aluno.matricula && (
                            <span className="text-[9.5px] font-bold text-azul/80 bg-cinza-claro px-1.5 py-0.5 rounded shrink-0">
                              {aluno.matricula}
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-extrabold text-azul bg-bege/60 rounded px-1.5 py-0.5 shrink-0">
                          {aluno.username}
                        </span>
                        <span className="font-mono font-extrabold text-coral-texto tracking-widest bg-bege/60 rounded px-1.5 py-0.5 shrink-0">
                          {aluno.senha_temporaria}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-azul/80">
                    Anote agora, as senhas não aparecem de novo depois. Todos já foram adicionados à fila de impressão da turma.
                  </p>

                  <Button variante="contorno" onClick={reiniciarCadastroLote} className="px-6 py-2.5 text-sm">
                    Cadastrar mais alunos
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col gap-3 relative"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastandoArquivo(true);
                  }}
                  onDragLeave={(e) => {
                    // dragleave dispara também ao passar de um filho pro outro
                    // dentro da área; só conta quando o ponteiro saiu de verdade
                    if (!e.currentTarget.contains(e.relatedTarget)) setArrastandoArquivo(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setArrastandoArquivo(false);
                    importarArquivoDeAlunos(e.dataTransfer.files[0]);
                  }}
                >
                  {arrastandoArquivo && (
                    <div className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-coral bg-bege/95 flex items-center justify-center pointer-events-none">
                      <span className="text-coral-texto font-bold text-sm">Solte a lista aqui</span>
                    </div>
                  )}
                  {/* flex, não grid: cada input pede um "mínimo de conteúdo" pra
                      não encolher (min-width automático do navegador); min-w-0
                      derruba isso e deixa o flex-1 mandar de verdade — sem essa
                      linha, Nome/Sobrenome empurravam Matrícula e o "×" pra fora
                      em telas mais estreitas. */}
                  <div className="flex gap-2.5 px-0.5">
                    <span className="flex-1 min-w-0 rotulo">Nome</span>
                    <span className="flex-1 min-w-0 rotulo">Sobrenome</span>
                    <span className="w-28 shrink-0 rotulo">Matrícula</span>
                    <span className="w-7 shrink-0" />
                  </div>

                  {/* Uma linha = um aluno, pra 1 ou pra 30 é o mesmo formulário.
                      Enter em qualquer campo adiciona a próxima linha e já leva
                      o foco pra ela — o botão pontilhado abaixo faz o mesmo pra
                      quem prefere o mouse. */}
                  {/* p-1 -m-1: o container de scroll corta tudo que passa da
                      própria borda — sem essa folga, a sombra e o anel de foco
                      dos campos (que "vazam" um pouco pra fora da caixa) ficam
                      cortados embaixo. A margem negativa cancela o padding pra
                      não deslocar a lista em relação ao rótulo e ao botão. */}
                  <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto p-1 -m-1">
                    {linhasCadastro.map((linha, indice) => {
                      const ultimaLinha = indice === linhasCadastro.length - 1;
                      const aoPressionarEnter = (e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        adicionarLinhaCadastro();
                      };
                      // Colar uma lista inteira (do Excel, do Word, de onde for)
                      // em qualquer campo espalha os nomes pelas linhas. Texto
                      // sem quebra nem separador é cola normal de um valor só,
                      // então deixa o navegador fazer o trabalho dele.
                      const aoColar = (e) => {
                        const texto = e.clipboardData.getData("text");
                        if (!/[\n\t;]/.test(texto)) return;
                        if (colarLinhasCadastro(texto)) e.preventDefault();
                      };
                      return (
                        <div key={linha.chave} className="flex gap-2.5 items-center">
                          <Input
                            ref={ultimaLinha ? refUltimoNome : undefined}
                            type="text"
                            value={linha.nome}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "nome", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            onPaste={aoColar}
                            placeholder="Ex: João"
                            className="flex-1 min-w-0 py-2 text-sm"
                          />
                          <Input
                            type="text"
                            value={linha.sobrenome}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "sobrenome", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            onPaste={aoColar}
                            placeholder="Ex: Silva"
                            className="flex-1 min-w-0 py-2 text-sm"
                          />
                          <Input
                            type="text"
                            value={linha.matricula}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "matricula", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            onPaste={aoColar}
                            placeholder="Opcional"
                            className="w-28 shrink-0 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removerLinhaCadastro(linha.chave)}
                            disabled={linhasCadastro.length === 1}
                            aria-label="Remover esta linha"
                            title="Remover esta linha"
                            className="w-7 h-7 rounded-lg text-azul/30 hover:text-vermelho hover:bg-vermelho/5 disabled:opacity-0 disabled:pointer-events-none font-bold text-lg flex items-center justify-center shrink-0 transition-all"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mesmo visual do card pontilhado "Criar nova turma" da lista
                      de turmas — reaproveita a linguagem que já existe no app
                      pra "adicionar mais um" em vez de inventar um botão novo */}
                  <button
                    type="button"
                    onClick={adicionarLinhaCadastro}
                    className="border-2 border-dashed border-coral/40 rounded-2xl py-2.5 flex items-center justify-center gap-2 text-coral-texto font-bold text-sm hover:bg-coral/5 transition-all active:scale-[0.99]"
                  >
                    <span className="text-lg leading-none">+</span> Adicionar outro aluno
                  </button>

                  <p className="text-xs text-azul/80">
                    {lendoArquivo ? (
                      <span className="font-bold text-coral-texto">Lendo o arquivo...</span>
                    ) : (
                      <>
                        Cole a lista da chamada num campo, ou{" "}
                        <button
                          type="button"
                          onClick={() => refArquivoAlunos.current?.click()}
                          className="alvo-toque text-coral-texto font-bold hover:underline"
                        >
                          escolha um arquivo
                        </button>{" "}
                        .csv, .xlsx, .docx ou .txt. Arrastar pra cima desta janela também vale.
                      </>
                    )}{" "}
                    Matrícula é opcional. Usuário e senha de cada um são gerados automaticamente.
                  </p>

                  <input
                    ref={refArquivoAlunos}
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx,.docx"
                    hidden
                    onChange={(e) => {
                      importarArquivoDeAlunos(e.target.files[0]);
                      // zera pra escolher o mesmo arquivo de novo disparar change
                      e.target.value = "";
                    }}
                  />

                  {erroCadastroLote && (
                    <Alerta className="flex items-center justify-between gap-3">
                      <span>{erroCadastroLote}</span>
                    </Alerta>
                  )}

                  <Button
                    onClick={cadastrarAlunosLote}
                    disabled={cadastrandoLote || itensLote.length === 0}
                    className="px-6 py-2.5 text-sm"
                  >
                    {cadastrandoLote
                      ? "Cadastrando..."
                      : itensLote.length > 1
                      ? `Cadastrar ${itensLote.length} alunos`
                      : "Cadastrar aluno"}
                  </Button>
                </div>
              )
            )}

            {abaModalAluno === "existente" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="campo-buscar-por-nome-ou-matricula" className="rotulo">
                    Buscar por nome ou matrícula
                  </label>
                  <Input id="campo-buscar-por-nome-ou-matricula"
                    type="text"
                    value={buscaAlunoExistente}
                    onChange={(e) => setBuscaAlunoExistente(e.target.value)}
                    placeholder="Ex: Vinícius, ou 20231045"
                    autoFocus
                    className="w-full py-2 text-sm"
                  />
                </div>

                {erroMatricularExistente && (
                  <Alerta className="flex items-center justify-between gap-3">
                    <span>{erroMatricularExistente}</span>
                  </Alerta>
                )}

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {buscaAlunoExistente.trim().length < 2 && (
                    <p className="text-xs text-azul/80 text-center py-4">
                      Digite pelo menos 2 letras ou números pra buscar.
                    </p>
                  )}

                  {buscaAlunoExistente.trim().length >= 2 && !buscandoAlunoExistente && resultadosBusca.length === 0 && (
                    <p className="text-xs text-azul/80 text-center py-4">
                      Nenhum aluno seu bate com essa busca.
                    </p>
                  )}

                  {resultadosBusca.map((aluno) => {
                    const jaNaTurmaAtual = aluno.jaMatriculado || idsAlunosNaTurmaAtual.has(aluno.id);
                    return (
                    <div
                      key={aluno.id}
                      className="flex items-center gap-3 border border-cinza-claro/60 rounded-2xl px-3.5 py-2.5"
                    >
                      {aluno.avatar_url ? (
                        <img
                          src={`/avatares/${aluno.avatar_url}`}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-coral text-azul-escuro text-xs font-extrabold uppercase flex items-center justify-center shrink-0">
                          {(aluno.apelido || aluno.nome_completo || "?").charAt(0)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-extrabold text-azul truncate">
                            {aluno.apelido || aluno.nome_completo}
                          </span>
                          {aluno.matricula && (
                            <span className="text-xs font-bold text-azul/80 bg-cinza-claro px-1.5 py-0.5 rounded shrink-0">
                              {aluno.matricula}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aluno.turmas.filter(Boolean).map((turma, indice) => (
                            <span
                              key={`${aluno.id}-${indice}`}
                              className="text-xs font-bold bg-ouro-bg text-ouro-fg-escuro px-2 py-0.5 rounded-full"
                            >
                              {turma}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button
                        variante="secundario"
                        tamanho="sm"
                        onClick={() => matricularAlunoExistente(aluno.id)}
                        disabled={jaNaTurmaAtual || matriculandoAlunoId === aluno.id}
                        title={jaNaTurmaAtual ? "Esse aluno já está nesta turma" : undefined}
                        className="shrink-0 disabled:bg-verde/15 disabled:text-verde"
                      >
                        {jaNaTurmaAtual
                          ? "Já nesta turma"
                          : matriculandoAlunoId === aluno.id
                          ? "Adicionando..."
                          : "Adicionar"}
                      </Button>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
        </Modal>
      )}

      {senhaResetada && (
        <CredenciaisModal
          titulo="Nova senha gerada!"
          texto="A senha anterior parou de valer. Anote ou copie agora, essa senha não aparece de novo depois de fechar essa janela."
          username={senhaResetada.username}
          senha={senhaResetada.senha_temporaria}
          campoCopiado={campoCopiado}
          onCopiar={copiar}
          incluirImpressao={incluirNaImpressao}
          onToggleImpressao={setIncluirNaImpressao}
          onFechar={() => {
            if (incluirNaImpressao) {
              adicionarNaFilaImpressao(senhaResetada.username, senhaResetada.senha_temporaria);
            }
            fecharSenhaResetada();
          }}
        />
      )}

      {/* Ranking da turma — só leitura, ordenado por XP. Mora num modal e não
          num card fixo porque é consulta eventual: no dia a dia o professor está
          aqui pra gerenciar alunos/atividades, não pra acompanhar pontuação */}
      {rankingAberto && (
        <Modal aberto onFechar={() => setRankingAberto(false)} className="max-w-md">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <StarIcon size={18} isAnimated={false} className="text-ouro-fg-escuro" />
                <p className="font-extrabold text-azul text-lg">Ranking da turma</p>
              </div>
              <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={() => setRankingAberto(false)}>
                ×
              </Button>
            </div>

            {rankingAlunos.length === 0 ? (
              <p className="text-sm text-azul/80 py-2">
                Sem alunos na turma ainda. O ranking aparece quando eles entrarem.
              </p>
            ) : (
              <>
                {/* Rótulos em vez de explicar em texto corrido o que cada número
                    significa: a coluna se explica sozinha em cima do dado */}
                <div className="flex items-center gap-3 mt-4 pb-2 border-b border-cinza-claro/40">
                  <span className="w-6 shrink-0" />
                  <span className="w-8 shrink-0" />
                  <span className="grow rotulo">
                    Aluno
                  </span>
                  <span className="w-20 text-right rotulo shrink-0">
                    Atividades
                  </span>
                  <span className="w-16 text-right rotulo shrink-0">
                    XP
                  </span>
                </div>

                <ul className="flex flex-col max-h-96 overflow-y-auto">
                {rankingAlunos.map((aluno, indice) => (
                  <li
                    key={aluno.aluno_id}
                    className="flex items-center gap-3 py-2.5 border-b border-cinza-claro/20 last:border-0"
                  >
                    <span
                      className={`w-6 shrink-0 text-center text-sm font-extrabold ${
                        temXp ? (indice < 3 ? "text-ouro-fg" : "text-azul/35") : "text-azul/25"
                      }`}
                    >
                      {temXp ? indice + 1 : "–"}
                    </span>

                    {aluno.avatar_url ? (
                      <img
                        src={`/avatares/${aluno.avatar_url}`}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-coral text-azul-escuro text-xs font-extrabold uppercase flex items-center justify-center shrink-0">
                        {(aluno.nome || "?").charAt(0)}
                      </div>
                    )}

                    <span className="text-sm font-semibold text-azul grow min-w-0 truncate">
                      {aluno.nome}
                    </span>

                    <span className="w-20 text-right text-xs font-bold text-azul/80 shrink-0">
                      {aluno.atividades_concluidas} de {totalAtividadesPublicadas}
                    </span>

                    <span
                      className={`text-[13px] font-extrabold shrink-0 w-16 text-right ${
                        aluno.xp_total > 0 ? "text-ouro-fg-escuro" : "text-azul/30"
                      }`}
                    >
                      {aluno.xp_total} XP
                    </span>
                  </li>
                ))}
                </ul>
              </>
            )}
        </Modal>
      )}

      {/* Confirmação de remoção — substitui o window.confirm() nativo, que não
          tinha espaço pra explicar que a conta do aluno não é apagada */}
      {alunoParaRemover && (
        <Modal aberto onFechar={cancelarRemocaoAluno} className="max-w-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-vermelho/10 text-vermelho flex items-center justify-center">
              <Trash2 size={28} />
            </div>

            <h3 className="text-xl font-extrabold text-azul mt-3">
              Remover da turma?
            </h3>
            <p className="text-sm text-azul/80 mt-2">
              <strong className="text-azul">{alunoParaRemover.nome}</strong> sai
              da lista e deixa de ver as atividades desta turma.
            </p>

            <p className="text-xs text-azul/80 leading-relaxed bg-bege/60 rounded-xl px-4 py-3 mt-4">
              A conta dele <strong className="text-azul">não é apagada</strong>,
              ele continua nas outras turmas em que está matriculado, e pode ser
              adicionado de volta a esta depois.
            </p>

            <div className="flex gap-3 w-full mt-5">
              <Button variante="contorno" onClick={cancelarRemocaoAluno} className="flex-1">
                Cancelar
              </Button>
              <Button
                variante="perigo"
                onClick={confirmarRemocaoAluno}
                disabled={removendoMatriculaId === alunoParaRemover.matricula_id}
                className="flex-1"
              >
                {removendoMatriculaId === alunoParaRemover.matricula_id
                  ? "Removendo..."
                  : "Remover"}
              </Button>
            </div>
        </Modal>
      )}

      {/* Modal de erro — mesmo padrão da tela de criar atividade */}
      {erroAcaoAluno && (
        <Modal aberto onFechar={fecharErroAcaoAluno} className="sm:p-8 flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-vermelho/10 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-azul">
              Ops, algo deu errado
            </h3>
            <p className="text-sm text-azul/80">{erroAcaoAluno}</p>
            <Button variante="contorno" onClick={fecharErroAcaoAluno} className="px-6 py-2.5 text-sm mt-2">
              Entendi
            </Button>
        </Modal>
      )}
    </>
  );
}

export default TurmaForm;
