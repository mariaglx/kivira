import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ListChecks, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { apiRequest } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Lista, Item, Modal } from "../../components/ui/Animacao";
import { Alerta } from "../../components/ui/Alerta";
import { BarraConclusao, Chip, ChipDisciplina, Filtro, IconeDisciplina, MenuMais } from "../../components/professor/Relatorio";
import { useApi } from "../../controllers/useApi";
import { corDisciplina } from "../../utils/disciplina";
import { DIFICULDADE_PROFESSOR } from "../../utils/dificuldade";
import { ehAdmin } from "../../services/sessao";

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function CartaoAtividade({ atividade, onVerQuestoes, onExcluir }) {
  const cor = corDisciplina(atividade.disciplina);
  const dificuldade = DIFICULDADE_PROFESSOR[atividade.dificuldade];
  return (
    <div className="cartao rounded-2xl overflow-hidden flex flex-col flex-1">
      <div className={`h-24 relative flex items-center justify-center ${cor.bg} ${cor.fg}`}>
        {atividade.imagem_atividade_url ? (
          <img src={atividade.imagem_atividade_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <IconeDisciplina disciplina={atividade.disciplina} size={38} />
        )}
        <span
          className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            atividade.publicado ? "bg-verde text-branco" : "bg-branco text-azul"
          }`}
        >
          {atividade.publicado ? "Publicada" : "Rascunho"}
        </span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-2.5 flex-1">
        <h2 className="font-display font-extrabold text-[17px] text-azul break-words">{atividade.titulo}</h2>
        <div className="flex flex-wrap gap-1.5">
          <ChipDisciplina disciplina={atividade.disciplina} />
          {dificuldade && <Chip className={dificuldade.estilo}>{dificuldade.rotulo}</Chip>}
        </div>
        {ehAdmin() && atividade.professor_nome && (
          <p className="text-xs font-bold text-coral-texto">Prof. {atividade.professor_nome}</p>
        )}
        {atividade.publicado && atividade.alunos_turma > 0 ? (
          <div className="flex items-center gap-2 text-sm font-bold text-azul">
            <BarraConclusao valor={atividade.alunos_concluiram} max={atividade.alunos_turma} className="flex-1" />
            {atividade.alunos_concluiram}/{atividade.alunos_turma}
          </div>
        ) : (
          <p className="text-sm text-azul/80">
            {plural(atividade.total_questoes ?? 0, "bloco", "blocos")} · {atividade.turma_nome ?? "Sem turma"}
          </p>
        )}
        <div className="mt-auto pt-2.5 border-t border-cinza-claro flex justify-between items-center gap-2">
          <Link
            to={atividade.publicado ? `/professor/atividades/${atividade.id}/relatorio` : `/professor/atividades/${atividade.id}/editar`}
            className="alvo-toque font-display font-extrabold text-sm text-coral-texto flex items-center gap-1 hover:underline"
          >
            {atividade.publicado ? "Ver relatório" : "Continuar editando"} <ArrowRight size={16} />
          </Link>
          <MenuMais
            rotulo={`Mais ações de ${atividade.titulo}`}
            acima
            itens={[
              { rotulo: "Editar", Icone: Pencil, to: `/professor/atividades/${atividade.id}/editar` },
              { rotulo: "Ver questões", Icone: ListChecks, onClick: onVerQuestoes },
              { rotulo: "Excluir", Icone: Trash2, onClick: onExcluir, perigo: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function Atividades() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [turmaId, setTurmaId] = useState("");
  const [modalQuestoes, setModalQuestoes] = useState(null);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erroExcluir, setErroExcluir] = useState(null);
  const [excluidas, setExcluidas] = useState([]);
  const { dados, carregando } = useApi("/atividade/professor/minhas");

  async function abrirModalQuestoes(atividadeId) {
    setModalQuestoes({ questoes: [] });
    setCarregandoQuestoes(true);
    setErroQuestoes(null);
    try {
      setModalQuestoes(await apiRequest(`/atividade/${atividadeId}/questoes`));
    } catch (erro) {
      setErroQuestoes(erro.message || "Não foi possível carregar as questões.");
    } finally {
      setCarregandoQuestoes(false);
    }
  }

  async function confirmarExclusao() {
    const alvo = excluindo;
    setErroExcluir(null);
    setExcluindo({ ...alvo, enviando: true });
    try {
      await apiRequest(`/atividade/${alvo.id}`, { method: "DELETE" });
      setExcluidas((atual) => [...atual, alvo.id]);
      setExcluindo(null);
    } catch (erro) {
      setErroExcluir(erro.message || "Não foi possível excluir a atividade.");
      setExcluindo(alvo);
    }
  }

  const lista = (dados ?? []).filter((a) => !excluidas.includes(a.id));
  const publicadas = lista.filter((a) => a.publicado).length;
  const rascunhos = lista.length - publicadas;
  const turmas = [...new Map(lista.filter((a) => a.turma_id).map((a) => [a.turma_id, a.turma_nome])).entries()];
  const termo = busca.trim().toLowerCase();
  const atividadesFiltradas = lista
    .filter((a) => filtro === "todas" || (filtro === "publicadas" ? a.publicado : !a.publicado))
    .filter((a) => !turmaId || String(a.turma_id) === turmaId)
    .filter((a) => !termo || a.titulo.toLowerCase().includes(termo) || a.disciplina?.toLowerCase().includes(termo));

  return (
    <>
      <main className="pagina flex flex-col gap-5 lg:gap-6">
        <header className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-azul">
              {ehAdmin() ? "Atividades de todas as turmas" : "Atividades"}
            </h1>
            <p className="text-sm text-azul/80">
              {plural(lista.length, "atividade", "atividades")} · {plural(rascunhos, "rascunho", "rascunhos")}
            </p>
          </div>
          <Button as={Link} to="/professor/atividades/criar" className="gap-2 px-4 min-h-11 font-display font-extrabold">
            <Plus size={18} /> Nova atividade
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full lg:w-auto lg:flex-1 lg:max-w-sm">
            <Input
              icone={Search}
              placeholder="Buscar atividade"
              aria-label="Buscar atividade"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="py-2.5 text-sm bg-branco"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            <Filtro ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>Todas {lista.length}</Filtro>
            <Filtro ativo={filtro === "publicadas"} onClick={() => setFiltro("publicadas")}>Publicadas {publicadas}</Filtro>
            <Filtro ativo={filtro === "rascunhos"} onClick={() => setFiltro("rascunhos")}>Rascunhos {rascunhos}</Filtro>
          </div>
          {turmas.length > 1 && (
            <div className="w-48">
              <SelectCustom
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                placeholder="Todas as turmas"
                options={turmas.map(([id, nome]) => ({ value: String(id), label: nome }))}
              />
            </div>
          )}
        </div>

        {carregando ? (
          <Carregando embutido texto="Carregando atividades..." />
        ) : atividadesFiltradas.length === 0 && lista.length > 0 ? (
          <EstadoVazio>Nenhuma atividade com esse filtro.</EstadoVazio>
        ) : (
          <Lista className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {atividadesFiltradas.map((atividade) => (
              <Item key={atividade.id} elevar className="flex">
                <CartaoAtividade
                  atividade={atividade}
                  onVerQuestoes={() => abrirModalQuestoes(atividade.id)}
                  onExcluir={() => { setErroExcluir(null); setExcluindo(atividade); }}
                />
              </Item>
            ))}
            {lista.length === 0 && (
              <Item elevar className="flex">
                <Link
                  to="/professor/atividades/criar"
                  className="flex-1 border-2 border-dashed border-coral/60 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-1.5 text-center hover:bg-branco/50 transition-colors"
                >
                  <Plus size={28} className="text-coral-texto" />
                  <span className="font-display font-extrabold text-coral-texto">Criar sua primeira atividade</span>
                </Link>
              </Item>
            )}
          </Lista>
        )}
      </main>

      <Modal aberto={!!excluindo} onFechar={excluindo?.enviando ? undefined : () => setExcluindo(null)}>
        {excluindo && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-por-bg text-vermelho flex items-center justify-center">
                <Trash2 size={19} />
              </div>
              <div>
                <p className="font-display font-extrabold text-lg text-azul">Excluir atividade?</p>
                <p className="text-sm text-azul/80">
                  "{excluindo.titulo}" e as questões dela somem de vez. Não dá pra desfazer.
                </p>
              </div>
            </div>
            {erroExcluir && <Alerta>{erroExcluir}</Alerta>}
            <div className="flex justify-end gap-2">
              <Button variante="fantasma" tamanho="sm" onClick={() => setExcluindo(null)} disabled={excluindo.enviando}>
                Cancelar
              </Button>
              <Button variante="perigo" tamanho="sm" onClick={confirmarExclusao} disabled={excluindo.enviando} className="gap-1.5">
                <Trash2 size={14} /> {excluindo.enviando ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal aberto={!!modalQuestoes} onFechar={() => setModalQuestoes(null)} className="max-w-lg max-h-[85vh] overflow-y-auto">
        {modalQuestoes && (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-extrabold text-azul">Questões</p>
                {modalQuestoes.titulo && <p className="text-xs text-azul/80">{modalQuestoes.titulo}</p>}
              </div>
              <Button variante="fantasma" tamanho="icone" aria-label="Fechar" onClick={() => setModalQuestoes(null)}>
                <X size={16} />
              </Button>
            </div>

            {carregandoQuestoes && <p className="text-sm text-azul/80">Carregando questões...</p>}
            {erroQuestoes && <Alerta>{erroQuestoes}</Alerta>}
            {!carregandoQuestoes && !erroQuestoes && modalQuestoes.questoes?.length === 0 && (
              <p className="text-sm text-azul/80">Essa atividade ainda não tem nenhuma questão cadastrada.</p>
            )}

            {!carregandoQuestoes && modalQuestoes.questoes?.length > 0 && (
              <div className="flex flex-col gap-3">
                {modalQuestoes.questoes.map((questao) => (
                  <div key={questao.id} className="bg-bege/40 border border-bege rounded-2xl p-4 flex flex-col gap-2">
                    <span className="text-xs font-bold text-azul/80">Questão {questao.ordem}</span>
                    <p className="text-sm font-semibold text-azul">{questao.texto_questao}</p>
                    {questao.opcoes?.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {questao.opcoes.map((opcao) => (
                          <span
                            key={opcao.id}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                              opcao.correta ? "bg-verde/10 text-verde-texto font-bold" : "bg-branco text-azul/80"
                            }`}
                          >
                            {opcao.correta && <Check size={13} />}
                            {opcao.texto_opcao}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

export default Atividades;
