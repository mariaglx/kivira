import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { apiRequest } from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Carregando } from "../../components/ui/Carregando";
import { Lista, Item, Modal } from "../../components/ui/Animacao";

const TIPO_LABEL = {
  multipla_escolha: "Múltipla escolha",
  associacao: "Associação",
  arrastar_soltar: "Arrastar e soltar",
};

const DIFICULDADE_STYLE = {
  facil: "bg-green-100 text-green-600",
  medio: "bg-amber-100 text-amber-600",
  dificil: "bg-red-100 text-red-500",
};

export function Atividades() {
  const [busca, setBusca] = useState("");
  const [listaAtividades, setListaAtividades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalQuestoes, setModalQuestoes] = useState(null);
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false);
  const [erroQuestoes, setErroQuestoes] = useState(null);
  const navigate = useNavigate();

  async function abrirModalQuestoes(atividadeId) {
    setModalQuestoes({ questoes: [] });
    setCarregandoQuestoes(true);
    setErroQuestoes(null);
    try {
      const dados = await apiRequest(`/atividade/${atividadeId}/questoes`);
      setModalQuestoes(dados);
    } catch (erro) {
      setErroQuestoes(erro.message || "Não foi possível carregar as questões.");
    } finally {
      setCarregandoQuestoes(false);
    }
  }

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    async function carregarAtividades() {
      try {
        const response = await apiRequest("/atividade/professor/minhas", {
          signal: controller.signal,
        });
        if (!cancelado) setListaAtividades(Array.isArray(response) ? response : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar atividades:", err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarAtividades();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [navigate]);

  const atividadesFiltradas = listaAtividades.filter(
    (atividade) =>
      atividade.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      atividade.disciplina?.toLowerCase().includes(busca.toLowerCase()),
  );

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  });

  return (
    <>
      {/* 2. ÁREA PRINCIPAL */}
      <main className="pagina flex flex-col gap-6 lg:gap-8">
        <header className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Atividades</h1>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-azul mt-1">
              Suas atividades, Professor(a)!
            </h2>
            <p className="text-azul/70 text-sm mt-1">
              Gerencie e acompanhe todas as atividades criadas
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block bg-branco px-4 py-2 rounded-xl border border-cinza-claro text-xs font-semibold text-azul shadow-sm">
              {dataHoje}
            </div>
            <Button as={Link} to="/professor/atividades/criar" className="px-5 py-2 text-sm">
              + Nova Atividade
            </Button>
          </div>
        </header>

        <div className="w-full max-w-sm">
          <Input
            icone={Search}
            placeholder="Buscar atividade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="py-2.5 text-sm bg-branco shadow-sm"
          />
        </div>

        {carregando ? (
          <Carregando embutido texto="Carregando atividades..." />
        ) : (
        <Lista className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {atividadesFiltradas.map((atividade) => (
            <Item
              key={atividade.id}
              elevar
              className="cartao rounded-2xl p-6 flex flex-col gap-5 justify-between relative hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-azul">
                    {atividade.titulo}
                  </h3>
                  <span className="text-xs text-azul/50 font-medium">
                    {atividade.disciplina}
                  </span>
                </div>
                {atividade.publicado ? (
                  <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                    Publicada
                  </span>
                ) : (
                  <span className="badge bg-gray-100 text-gray-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                    Rascunho
                  </span>
                )}
              </div>

              <hr className="border-cinza-claro/30" />

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-azul/40 font-bold uppercase tracking-wider">
                    Tipo
                  </span>
                  <span className="text-azul font-semibold">
                    {TIPO_LABEL[atividade.tipo_atividade]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-azul/40 font-bold uppercase tracking-wider">
                    Dificuldade
                  </span>
                  <span
                    className={`badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${DIFICULDADE_STYLE[atividade.dificuldade]}`}
                  >
                    {atividade.dificuldade}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-azul/40 font-bold uppercase tracking-wider">
                    Turma
                  </span>
                  <span className="text-azul font-semibold">
                    {atividade.turma_nome ?? "Nenhuma"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-azul/40 font-bold uppercase tracking-wider">
                    Blocos
                  </span>
                  <span className="text-azul font-semibold">
                    {atividade.quantidade_blocos}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full">
                <Button tamanho="sm" onClick={() => abrirModalQuestoes(atividade.id)} className="flex-1">
                  Ver questões
                </Button>
                <Button
                  tamanho="sm"
                  variante="contorno"
                  onClick={() => navigate(`/professor/atividades/${atividade.id}/editar`)}
                  className="flex-1"
                >
                  Editar
                </Button>
              </div>
            </Item>
          ))}

          <Item elevar className="flex">
            <Link
              to="/professor/atividades/criar"
              className="flex-1 bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="text-3xl text-coral font-bold">+</span>
              <span className="text-sm font-bold text-coral/80">
                Criar nova atividade
              </span>
            </Link>
          </Item>
        </Lista>
        )}
      </main>

      <Modal aberto={!!modalQuestoes} onFechar={() => setModalQuestoes(null)} className="max-w-lg max-h-[85vh] overflow-y-auto">
        {modalQuestoes && (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-extrabold text-azul">Questões</p>
                {modalQuestoes.titulo && (
                  <p className="text-xs text-azul/50">{modalQuestoes.titulo}</p>
                )}
              </div>
              <Button
                variante="fantasma"
                tamanho="icone"
                aria-label="Fechar"
                onClick={() => setModalQuestoes(null)}
              >
                <X size={16} />
              </Button>
            </div>

            {carregandoQuestoes && (
              <p className="text-sm text-azul/60">Carregando questões...</p>
            )}

            {erroQuestoes && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {erroQuestoes}
              </div>
            )}

            {!carregandoQuestoes && !erroQuestoes && modalQuestoes.questoes?.length === 0 && (
              <p className="text-sm text-azul/60">
                Essa atividade ainda não tem nenhuma questão cadastrada.
              </p>
            )}

            {!carregandoQuestoes && modalQuestoes.questoes?.length > 0 && (
              <div className="flex flex-col gap-3">
                {modalQuestoes.questoes.map((questao) => (
                  <div
                    key={questao.id}
                    className="bg-bege/40 border border-bege rounded-2xl p-4 flex flex-col gap-2"
                  >
                    <span className="text-xs font-bold text-azul/40">
                      Questão {questao.ordem}
                    </span>
                    <p className="text-sm font-semibold text-azul">
                      {questao.texto_questao}
                    </p>
                    {questao.opcoes?.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {questao.opcoes.map((opcao) => (
                          <span
                            key={opcao.id}
                            className={`text-xs px-3 py-1.5 rounded-lg ${
                              opcao.correta
                                ? "bg-green-100 text-green-700 font-bold"
                                : "bg-branco text-azul/60"
                            }`}
                          >
                            {opcao.correta ? "✓ " : ""}
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
