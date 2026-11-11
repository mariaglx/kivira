import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTurmaForm } from "../../controllers/useTurmaForm";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  KeyRound,
  Plus,
  Power,
  Printer,
  TriangleAlert,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersRound,
  UserX,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Animacao";
import { Input } from "../../components/ui/Input";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Carregando } from "../../components/ui/Carregando";
import { Alerta } from "../../components/ui/Alerta";
import { Avatar } from "../../components/ui/Avatar";
import { Chip, CodigoCopiavel, TileDisciplina } from "../../components/professor/Relatorio";
import { useCopiar } from "../../controllers/useCopiar";
import { nomeDisciplina } from "../../utils/disciplina";
import { DIFICULDADE_PROFESSOR } from "../../utils/dificuldade";

// Botão "contorno coral" — sobre o cartão branco o botão não pode ser branco
// chapado, então a borda coral é que separa ele da superfície
const CLASSE_CONTORNO_CORAL =
  "alvo-toque inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 min-h-9 text-xs font-bold border-[1.5px] border-coral bg-branco text-coral-texto hover:bg-coral/10 transition disabled:opacity-50 disabled:cursor-not-allowed";

// Botão só de ícone nas linhas de aluno: 36px visíveis, 44px de toque (alvo-toque)
const CLASSE_ICONE_LINHA =
  "alvo-toque w-9 h-9 rounded-xl border-[1.5px] border-cinza-claro flex items-center justify-center shrink-0 text-azul hover:bg-bege/60 transition disabled:opacity-50 aria-disabled:opacity-50";

// 1º ao 9º ano do fundamental; uma turma antiga com outro texto continua
// aparecendo (é acrescentada nas opções em vez de sumir do campo)
const ANOS_ESCOLARES = Array.from({ length: 9 }, (_, i) => `${i + 1}º ano`);

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

// "2026-11-08" ou "2026-11-08T10:00:00" vira "08/11" — fatia a string em vez de
// passar por Date, que leria a data sem hora como UTC e podia voltar um dia
const diaMes = (data) => (data ? `${data.slice(8, 10)}/${data.slice(5, 7)}` : null);

function BotaoFechar({ onClick }) {
  return (
    <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={onClick}>
      <X size={18} />
    </Button>
  );
}

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
          <BotaoFechar onClick={onFechar} />
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
  const {
    escolherProfessor,
    professores,
    professorId,
    setProfessorId,
    modoEdicao,
    formData,
    nomeSalvo,
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
  const { copiado: codigoCopiado, copiar: copiarCodigo } = useCopiar();

  const opcoesAnoEscolar = [
    ...ANOS_ESCOLARES,
    ...(formData.ano_escolar && !ANOS_ESCOLARES.includes(formData.ano_escolar) ? [formData.ano_escolar] : []),
  ].map((ano) => ({ value: ano, label: ano }));

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
        <Link
          to={modoEdicao ? `/professor/turmas/${id}` : "/professor/turmas"}
          className="alvo-toque self-start inline-flex items-center gap-1.5 text-azul/80 hover:text-azul text-sm font-bold min-w-0"
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span className="truncate">{modoEdicao ? nomeSalvo || "Turma" : "Turmas"}</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {modoEdicao ? "Editar turma" : "Nova turma"}
            </h2>
            {modoEdicao && (
              <Chip className={formData.ativo ? "bg-cie-bg text-cie-fg-escuro" : "bg-cinza-claro text-azul"}>
                {formData.ativo ? "Ativa" : "Desativada"}
              </Chip>
            )}
          </div>

          {/* Turma nunca é excluída: o botão vai pro banco na hora (PATCH ativo),
              sem passar pelo Salvar do formulário */}
          {modoEdicao && (
            <Button
              variante="contorno"
              tamanho="sm"
              onClick={alternarAtivoTurma}
              disabled={alternandoAtivo}
              className="gap-2 shrink-0"
            >
              <Power size={16} />
              {formData.ativo ? "Desativar turma" : "Reativar turma"}
            </Button>
          )}
        </div>

        {erro && (
          <Alerta className="max-w-md">
            {erro}
          </Alerta>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
          {/* COLUNA ESQUERDA — dados da turma */}
          <form
            onSubmit={handleSubmit}
            className="w-full lg:max-w-xs cartao rounded-2xl p-5 flex flex-col gap-4 shrink-0 lg:sticky lg:top-8"
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
              <SelectCustom
                label="Ano escolar"
                name="ano_escolar"
                value={formData.ano_escolar}
                onChange={handleChange}
                options={opcoesAnoEscolar}
              />

              <div className="flex flex-col gap-1.5 min-w-0">
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
                Descrição <span className="normal-case tracking-normal font-medium">(opcional)</span>
              </label>
              <textarea id="campo-descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Uma breve descrição da turma"
                className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder:text-azul/75 shadow-sm transition-all text-sm resize-none"
              />
            </div>

            {modoEdicao && codigoAcesso && (
              <div className="bg-bege rounded-xl px-3.5 py-3 flex flex-col gap-1">
                <span className="rotulo">Código de acesso</span>
                <div className="flex items-center justify-between gap-2">
                  <b className="font-mono tracking-[0.14em] text-lg text-azul truncate">{codigoAcesso}</b>
                  <button
                    type="button"
                    onClick={() => copiarCodigo(codigoAcesso)}
                    aria-label={`Copiar o código ${codigoAcesso}`}
                    className={CLASSE_CONTORNO_CORAL}
                  >
                    {codigoCopiado ? <Check size={14} /> : <Copy size={14} />}
                    <span aria-live="polite">{codigoCopiado ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
                <p className="text-xs text-azul/80">Gerado automaticamente</p>
              </div>
            )}

            {/* Salvar sempre à vista no fim do formulário, com o estado do lado.
                Mexer em alunos não conta: aquilo já vai pro banco na hora. */}
            <div className="flex flex-wrap items-center gap-2 border-t border-cinza-claro pt-3">
              <span aria-live="polite" className="flex-1 min-w-0 text-sm font-bold">
                {modoEdicao &&
                  (houveAlteracao ? (
                    <span className="flex items-center gap-1.5 text-coral-texto">
                      <CircleAlert size={16} className="shrink-0" />
                      Alterações não salvas
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-verde-texto">
                      <CircleCheck size={16} className="shrink-0" />
                      Tudo salvo
                    </span>
                  ))}
              </span>
              {modoEdicao && houveAlteracao && (
                <Button variante="fantasma" tamanho="sm" disabled={salvando} onClick={desfazerAlteracoes}>
                  Desfazer
                </Button>
              )}
              <Button
                type="submit"
                tamanho="sm"
                disabled={salvando || !houveAlteracao}
                className="px-4 text-sm"
              >
                {salvando ? "Salvando..." : modoEdicao ? "Salvar" : "Criar turma"}
              </Button>
            </div>
          </form>

          {/* COLUNA DIREITA — alunos e atividades da turma (só existem já criada) */}
          {modoEdicao && (
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <section className="cartao rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-cinza-claro">
                  <h3 className="flex-1 whitespace-nowrap font-extrabold text-lg text-azul">
                    Alunos <span className="text-base text-azul/80">{alunos.length}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setRankingAberto(true)} className={CLASSE_CONTORNO_CORAL}>
                      <Trophy size={15} />
                      Ranking
                    </button>
                    {filaImpressao.length > 0 && (
                      <Button variante="fantasma" tamanho="sm" onClick={limparFilaImpressao}>
                        Limpar
                      </Button>
                    )}
                    {/* A fila só tem senhas geradas nesta aba (cadastro ou nova
                        senha) — sem nenhuma, não há o que imprimir */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      disabled={filaImpressao.length === 0}
                      title={filaImpressao.length === 0 ? "Cadastre alunos ou gere novas senhas pra imprimir os acessos" : undefined}
                      className={CLASSE_CONTORNO_CORAL}
                    >
                      <Printer size={15} />
                      Imprimir acessos{filaImpressao.length > 0 && ` (${filaImpressao.length})`}
                    </button>
                    {alunos.length > 0 && (
                      <Button tamanho="sm" onClick={abrirModalAluno} className="gap-1.5">
                        <UserPlus size={15} />
                        Adicionar aluno
                      </Button>
                    )}
                  </div>
                </div>

                {alunos.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 px-5 py-10">
                    <div className="w-14 h-14 rounded-2xl bg-pessego-bg text-pessego-fg flex items-center justify-center">
                      <UsersRound size={28} aria-hidden="true" />
                    </div>
                    <p className="font-extrabold text-lg text-azul">Chame a turma pra entrar</p>
                    <p className="text-sm text-azul/80 max-w-xs">
                      Passe o código pros alunos ou cadastre eles aqui.
                    </p>
                    <CodigoCopiavel codigo={codigoAcesso} className="bg-bege text-azul" />
                    <Button tamanho="sm" onClick={abrirModalAluno} className="gap-1.5 mt-1">
                      <UserPlus size={15} />
                      Adicionar aluno
                    </Button>
                  </div>
                ) : (
                  <ul className="flex flex-col">
                    {alunos.map((aluno) => {
                      const desativada = aluno.conta_ativa === false;
                      const nome = aluno.apelido || aluno.nome_completo;
                      const detalhe = [
                        aluno.apelido ? aluno.nome_completo : null,
                        aluno.matricula ? `matrícula ${aluno.matricula}` : "sem matrícula",
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li
                          key={aluno.matricula_id}
                          className={`flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-cinza-claro last:border-0 ${
                            desativada ? "bg-cinza-claro/30" : ""
                          }`}
                        >
                          <Avatar
                            arquivo={aluno.avatar_url}
                            nome={nome}
                            className={`w-10 h-10 text-sm rounded-full ${desativada ? "opacity-50" : ""}`}
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/professor/turmas/${id}/alunos/${aluno.aluno_id}`}
                              className={`block truncate font-bold hover:text-coral-texto hover:underline underline-offset-2 ${
                                desativada ? "text-azul/80" : "text-azul"
                              }`}
                            >
                              {nome}
                            </Link>
                            {desativada ? (
                              <Chip className="bg-cinza-claro text-azul mt-0.5">Conta desativada</Chip>
                            ) : (
                              <p className="text-xs text-azul/80 truncate">{detalhe}</p>
                            )}
                          </div>

                          {desativada ? (
                            <button
                              type="button"
                              onClick={() => alternarContaAluno(aluno)}
                              disabled={alternandoContaAlunoId === aluno.aluno_id}
                              aria-label={`Reativar a conta de ${nome}`}
                              className={CLASSE_CONTORNO_CORAL}
                            >
                              <UserCheck size={15} />
                              Reativar
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                // aria-disabled em vez de disabled: botão desabilitado perde o
                                // foco, e aí o modal da senha não tem pra onde devolver ao fechar
                                onClick={() => resetandoSenhaAlunoId !== aluno.aluno_id && resetarSenhaAluno(aluno.aluno_id)}
                                aria-disabled={resetandoSenhaAlunoId === aluno.aluno_id}
                                aria-label={`Gerar nova senha pra ${nome}`}
                                title="Gerar nova senha"
                                className={CLASSE_ICONE_LINHA}
                              >
                                <KeyRound size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => alternarContaAluno(aluno)}
                                disabled={alternandoContaAlunoId === aluno.aluno_id}
                                aria-label={`Desativar a conta de ${nome}`}
                                title="Desativar conta"
                                className={CLASSE_ICONE_LINHA}
                              >
                                <UserX size={16} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => pedirRemocaoAluno(aluno)}
                            disabled={removendoMatriculaId === aluno.matricula_id}
                            aria-label={`Tirar ${nome} da turma`}
                            title="Tirar da turma"
                            className={`${CLASSE_ICONE_LINHA} text-vermelho`}
                          >
                            <UserMinus size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="cartao rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-cinza-claro">
                  <h3 className="flex-1 whitespace-nowrap font-extrabold text-lg text-azul">
                    Atividades <span className="text-base text-azul/80">{atividades.length}</span>
                  </h3>
                  <Link
                    to="/professor/atividades/criar"
                    state={{ turmaIdPadrao: id }}
                    className="alvo-toque inline-flex items-center gap-1 font-display font-extrabold text-sm text-coral-texto hover:underline underline-offset-2"
                  >
                    <Plus size={16} />
                    Nova atividade
                  </Link>
                </div>
                {atividades.length === 0 ? (
                  <p className="text-sm text-azul/80 px-4 sm:px-5 py-4">
                    Nenhuma atividade atribuída a essa turma ainda.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {atividades.map((atividade) => {
                      const blocos = atividade.total_questoes ?? atividade.quantidade_blocos;
                      const detalhe = [
                        nomeDisciplina(atividade.disciplina) || null,
                        DIFICULDADE_PROFESSOR[atividade.dificuldade]?.rotulo,
                        blocos != null ? plural(blocos, "bloco", "blocos") : null,
                        atividade.data_criacao ? `criada ${diaMes(atividade.data_criacao)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li key={atividade.id} className="border-b border-cinza-claro last:border-0">
                          {/* Rascunho abre pra continuar editando; publicada abre o relatório */}
                          <Link
                            to={`/professor/atividades/${atividade.id}/${atividade.publicado ? "relatorio" : "editar"}`}
                            className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-bege/40 transition"
                          >
                            <TileDisciplina
                              disciplina={atividade.disciplina}
                              imagem={atividade.imagem_atividade_url}
                              className="w-10 h-10 rounded-xl"
                              tamanhoIcone={18}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-azul truncate">{atividade.titulo}</p>
                              <p className="text-xs text-azul/80 truncate">{detalhe}</p>
                            </div>
                            <Chip
                              className={
                                atividade.publicado ? "bg-cie-bg text-cie-fg-escuro" : "bg-cinza-claro text-azul"
                              }
                            >
                              {atividade.publicado ? "Publicada" : "Rascunho"}
                            </Chip>
                            <ChevronRight size={18} className="text-coral-texto shrink-0" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
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
              <BotaoFechar onClick={fecharModalAluno} />
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
                    <span className="w-6 h-6 rounded-full bg-verde text-branco flex items-center justify-center shrink-0">
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold text-azul">
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
                            <span className="text-xs font-bold text-azul/80 bg-cinza-claro px-1.5 py-0.5 rounded shrink-0">
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
                <div className="flex flex-col gap-3">
                  {/* flex, não grid: cada input pede um "mínimo de conteúdo" pra
                      não encolher (min-width automático do navegador); min-w-0
                      derruba isso e deixa o flex-1 mandar de verdade — sem essa
                      linha, Nome/Sobrenome empurravam Matrícula e o "x" pra fora
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
                      return (
                        <div key={linha.chave} className="flex gap-2.5 items-center">
                          <Input
                            ref={ultimaLinha ? refUltimoNome : undefined}
                            type="text"
                            aria-label={`Nome do aluno ${indice + 1}`}
                            value={linha.nome}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "nome", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            placeholder="Ex: João"
                            className="flex-1 min-w-0 py-2 text-sm"
                          />
                          <Input
                            type="text"
                            aria-label={`Sobrenome do aluno ${indice + 1}`}
                            value={linha.sobrenome}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "sobrenome", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            placeholder="Ex: Silva"
                            className="flex-1 min-w-0 py-2 text-sm"
                          />
                          <Input
                            type="text"
                            aria-label={`Matrícula do aluno ${indice + 1}`}
                            value={linha.matricula}
                            onChange={(e) => alterarLinhaCadastro(linha.chave, "matricula", e.target.value)}
                            onKeyDown={aoPressionarEnter}
                            placeholder="Opcional"
                            className="w-28 shrink-0 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removerLinhaCadastro(linha.chave)}
                            disabled={linhasCadastro.length === 1}
                            aria-label="Remover esta linha"
                            title="Remover esta linha"
                            className="w-7 h-7 rounded-lg text-azul/60 hover:text-vermelho hover:bg-vermelho/5 disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center shrink-0 transition-all"
                          >
                            <X size={16} />
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
                    <Plus size={16} /> Adicionar outro aluno
                  </button>

                  <p className="text-xs text-azul/80">
                    Matrícula é opcional. Usuário e senha de cada um são gerados automaticamente.
                  </p>

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
                      <Avatar
                        arquivo={aluno.avatar_url}
                        nome={aluno.apelido || aluno.nome_completo}
                        className="w-9 h-9 text-xs rounded-lg"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-azul truncate">
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
                <Trophy size={18} className="text-ouro-fg-escuro" aria-hidden="true" />
                <p className="font-extrabold text-azul text-lg">Ranking da turma</p>
              </div>
              <BotaoFechar onClick={() => setRankingAberto(false)} />
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

                    <Avatar arquivo={aluno.avatar_url} nome={aluno.nome} className="w-8 h-8 text-xs rounded-lg" />

                    <span className="text-sm font-semibold text-azul grow min-w-0 truncate">
                      {aluno.nome}
                    </span>

                    <span className="w-20 text-right text-xs font-bold text-azul/80 shrink-0">
                      {aluno.atividades_concluidas} de {totalAtividadesPublicadas}
                    </span>

                    <span
                      className={`text-sm font-extrabold shrink-0 w-16 text-right ${
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
              <UserMinus size={28} aria-hidden="true" />
            </div>

            <h3 className="text-xl font-extrabold text-azul mt-3">
              Tirar da turma?
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
                  ? "Tirando..."
                  : "Tirar da turma"}
              </Button>
            </div>
        </Modal>
      )}

      {/* Modal de erro — mesmo padrão da tela de criar atividade */}
      {erroAcaoAluno && (
        <Modal aberto onFechar={fecharErroAcaoAluno} className="sm:p-8 flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-vermelho/10 text-vermelho flex items-center justify-center">
              <TriangleAlert size={28} aria-hidden="true" />
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
