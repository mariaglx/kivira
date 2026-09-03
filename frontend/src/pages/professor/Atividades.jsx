import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../../components/professor/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const listaAtividades = [
    {
      id: 1,
      titulo: "Sons dos Animais",
      disciplina: "Ciências",
      tipo_atividade: "arrastar_soltar",
      dificuldade: "facil",
      turma: "3º Ano A",
      quantidade_blocos: 12,
      publicado: true,
    },
    {
      id: 2,
      titulo: "Tabuada do 3",
      disciplina: "Matemática",
      tipo_atividade: "multipla_escolha",
      dificuldade: "medio",
      turma: "4º Ano B",
      quantidade_blocos: 8,
      publicado: true,
    },
    {
      id: 3,
      titulo: "Capitais e Países",
      disciplina: "Geografia",
      tipo_atividade: "associacao",
      dificuldade: "dificil",
      turma: null,
      quantidade_blocos: 10,
      publicado: false,
    },
  ];

  const atividadesFiltradas = listaAtividades.filter(
    (atividade) =>
      atividade.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      atividade.disciplina.toLowerCase().includes(busca.toLowerCase()),
  );

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      <Sidebar ativo="atividades" />

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Atividades</h1>
            <h2 className="text-3xl font-extrabold text-azul mt-1">
              Suas atividades, Professor(a)!
            </h2>
            <p className="text-azul/70 text-sm mt-1">
              Gerencie e acompanhe todas as atividades criadas
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-branco px-4 py-2 rounded-xl border border-cinza-claro text-xs font-semibold text-azul shadow-sm">
              {dataHoje}
            </div>
            <Link
              to="/professor/atividades/criar"
              className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-5 py-2 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              + Nova Atividade
            </Link>
          </div>
        </header>

        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/40 text-sm">
            <FontAwesomeIcon icon={["fas", "magnifying-glass"]} />
          </span>
          <input
            type="text"
            placeholder="Buscar atividade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {atividadesFiltradas.map((atividade) => (
            <div
              key={atividade.id}
              className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 justify-between relative hover:shadow-md transition-shadow"
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
                    {atividade.turma ?? "Nenhuma"}
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
                <button className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case shadow-sm transition-all active:scale-95">
                  Ver questões
                </button>
                <button className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case transition-all active:scale-95">
                  Editar
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/professor/atividades/criar"
            className="bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
          >
            <span className="text-3xl text-coral font-bold">+</span>
            <span className="text-sm font-bold text-coral/80">
              Criar nova atividade
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
