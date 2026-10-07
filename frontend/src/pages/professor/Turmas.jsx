import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Carregando } from "../../components/ui/Carregando";
import { Lista, Item, Modal } from "../../components/ui/Animacao";

export function Turmas() {
  const [busca, setBusca] = useState("");
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [listaTurmas, setListaTurmas] = useState([]);
  const [turmaVisualizada, setTurmaVisualizada] = useState(null);
  const [alunosVisualizados, setAlunosVisualizados] = useState([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  // Guarda qual turma foi clicada por último — se o professor clicar em "Ver
  // turma" de A e depois de B antes da resposta de A voltar, essa referência
  // garante que só a resposta da turma ainda selecionada (B) é aplicada,
  // mesmo que a resposta de A chegue depois da de B.
  const turmaVisualizadaIdRef = useRef(null);

  const abrirVerTurma = (turma) => {
    turmaVisualizadaIdRef.current = turma.id;
    setTurmaVisualizada(turma);
    setAlunosVisualizados([]);
    setCarregandoAlunos(true);
    apiRequest(`/aluno_turma/turma/${turma.id}`)
      .then((dados) => {
        if (turmaVisualizadaIdRef.current === turma.id) setAlunosVisualizados(dados);
      })
      .finally(() => {
        if (turmaVisualizadaIdRef.current === turma.id) setCarregandoAlunos(false);
      });
  };

  const fecharVerTurma = () => {
    turmaVisualizadaIdRef.current = null;
    setTurmaVisualizada(null);
  };

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    async function carregarTurmas() {
      try {
        const response = await apiRequest("/turma/", { signal: controller.signal });
        if (!cancelado) setListaTurmas(Array.isArray(response) ? response : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar turmas:", err.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarTurmas();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [navigate]);

  // Filtra as turmas com base no input de pesquisa
  const turmasFiltradas = listaTurmas.filter(
    (turma) =>
      turma.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      turma.ano_escolar?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      {/* 2. ÁREA PRINCIPAL */}
      <main className="pagina flex flex-col gap-6 lg:gap-8">
        <header className="flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
          <Button onClick={() => navigate("/professor/turmas/nova")} className="px-5 py-2 text-sm">
            + Nova Turma
          </Button>
        </header>

        {/* Barra de Pesquisa */}
        <div className="w-full max-w-sm">
          <Input
            icone={Search}
            placeholder="Buscar turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="py-2.5 text-sm bg-branco shadow-sm"
          />
        </div>

        {/* Grid de Cards */}
        {carregando ? (
          <Carregando embutido texto="Carregando turmas..." />
        ) : (
          <Lista className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {turmasFiltradas.map((turma) => (
              <Item
                key={turma.id}
                elevar
                className="cartao rounded-2xl p-6 flex flex-col gap-5 justify-between relative hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-azul">{turma.nome}</h3>
                    <span className="text-xs text-azul/50 font-medium">
                      {turma.ano_escolar}
                    </span>
                  </div>
                  {turma.ativo ? (
                    <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                      Ativa
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                      Inativa
                    </span>
                  )}
                </div>

                <hr className="border-cinza-claro/30" />

                <div className="flex gap-8">
                  <div>
                    <div className="text-xl font-extrabold text-azul">
                      {turma.alunos_count ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">
                      Alunos
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-azul">
                      {turma.atividades_count ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">
                      Atividades
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <Button tamanho="sm" onClick={() => abrirVerTurma(turma)} className="flex-1">
                    Ver turma
                  </Button>
                  <Button
                    tamanho="sm"
                    variante="contorno"
                    onClick={() => navigate(`/professor/turmas/${turma.id}/editar`)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                </div>
              </Item>
            ))}

            {/* Card Pontilhado "Criar nova turma" */}
            <Item
              as="button"
              elevar
              onClick={() => navigate("/professor/turmas/nova")}
              className="bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="text-3xl text-coral font-bold">+</span>
              <span className="text-sm font-bold text-coral/80">
                Criar nova turma
              </span>
            </Item>
          </Lista>
        )}
      </main>

      <Modal aberto={!!turmaVisualizada} onFechar={fecharVerTurma}>
        {turmaVisualizada && (
          <>
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="font-extrabold text-azul text-lg">{turmaVisualizada.nome}</p>
                {turmaVisualizada.ativo ? (
                  <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold mt-1.5">
                    Ativa
                  </span>
                ) : (
                  <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold mt-1.5">
                    Inativa
                  </span>
                )}
              </div>
              <Button
                variante="fantasma"
                tamanho="icone"
                aria-label="Fechar"
                onClick={fecharVerTurma}
              >
                ×
              </Button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-azul/50 mt-5 mb-2">
              Alunos ({alunosVisualizados.length})
            </p>

            {carregandoAlunos ? (
              <p className="text-sm text-azul/60 py-2">Carregando...</p>
            ) : alunosVisualizados.length === 0 ? (
              <p className="text-sm text-azul/60 py-2">Nenhum aluno matriculado ainda.</p>
            ) : (
              <ul className="flex flex-col max-h-72 overflow-y-auto">
                {alunosVisualizados.map((aluno) => (
                  <li
                    key={aluno.matricula_id}
                    className="flex items-center gap-3 py-2.5 border-b border-cinza-claro/20 last:border-0"
                  >
                    {aluno.avatar_url && (
                      <img
                        src={`/avatares/${aluno.avatar_url}`}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <span className="text-sm font-semibold text-azul">
                      {aluno.apelido || aluno.nome_completo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
export default Turmas;
