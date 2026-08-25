import React, { useState } from "react";

export function Turmas() {
  const [busca, setBusca] = useState("");

  const listaTurmas = [
    { id: 1, nome: "3º Ano A", materia: "Matemática", alunos: 18, atividades: 5, status: "Ativa" },
    { id: 2, nome: "4º Ano B", materia: "Português", alunos: 15, atividades: 3, status: "Ativa" },
    { id: 3, nome: "2º Ano A", materia: "Ciências", alunos: 14, atividades: 4, status: "Pausada" },
  ];

  // Filtra as turmas com base no input de pesquisa
  const turmasFiltradas = listaTurmas.filter((turma) =>
    turma.nome.toLowerCase().includes(busca.toLowerCase()) ||
    turma.materia.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      
      {/* 1. SIDEBAR (Barra Lateral Esquerda) */}
      <aside className="w-64 bg-[#1e2a38] text-branco flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center font-bold text-branco text-sm shadow-md">
              K
            </div>
            <span className="font-extrabold tracking-widest text-lg text-branco">KIVIRA</span>
          </div>

          {/* Menu de Navegação */}
          <nav className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Menu</span>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="Dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Dashboard
                </a>
              </li>
              {/* Item Ativo (Turmas) */}
              <li>
                <a href="Turmas" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-branco/10 text-branco font-medium transition-all relative">
                  <span className="w-2 h-2 rounded-full bg-coral absolute left-2"></span>
                  <span className="pl-2">Turmas</span>
                </a>
              </li>
              <li>
                <a href="Atividades" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Atividades
                </a>
              </li>
              <li>
                <a href="Configuracoes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Configurações
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Perfil do Professor */}
        <div className="flex items-center gap-3 border-t border-branco/10 pt-4 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-coral/80 flex items-center justify-center font-bold text-branco shadow-md">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-branco">Professor(a)</span>
            <span className="text-xs text-gray-400">Ver perfil →</span>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        
        {/* Cabeçalho */}
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Turmas</h2>
          <button className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-5 py-2 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95">
            + Nova Turma
          </button>
        </header>

        {/* Barra de Pesquisa */}
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/40 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
          />
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Turmas Existentes */}
          {turmasFiltradas.map((turma) => (
            <div 
              key={turma.id} 
              className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5 justify-between relative hover:shadow-md transition-shadow"
            >
              {/* Header do Card (Título, Matéria e Status) */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-azul">{turma.nome}</h3>
                  <span className="text-xs text-azul/50 font-medium">{turma.materia}</span>
                </div>
                {turma.status === "Ativa" ? (
                  <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                    Ativa
                  </span>
                ) : (
                  <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-[10px] font-bold">
                    Pausada
                  </span>
                )}
              </div>

              {/* Linha Divisória Sutil */}
              <hr className="border-cinza-claro/30" />

              {/* Informações Numéricas */}
              <div className="flex gap-8">
                <div>
                  <div className="text-xl font-extrabold text-azul">{turma.alunos}</div>
                  <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">Alunos</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-azul">{turma.atividades}</div>
                  <div className="text-[10px] uppercase tracking-wider text-azul/40 font-bold">Atividades</div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2 w-full">
                <button className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case shadow-sm transition-all active:scale-95">
                  Ver turma
                </button>
                <button className="btn bg-azul/5 hover:bg-azul/10 text-azul border-none rounded-xl flex-1 py-2 h-auto min-h-0 text-xs font-bold normal-case transition-all active:scale-95">
                  Editar
                </button>
              </div>
            </div>
          ))}

          {/* Card Pontilhado "Criar nova turma" */}
          <button className="bg-branco/40 hover:bg-branco/80 border-2 border-dashed border-coral/40 rounded-2xl p-6 min-h-[220px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95">
            <span className="text-3xl text-coral font-bold">+</span>
            <span className="text-sm font-bold text-coral/80">Criar nova turma</span>
          </button>
          
        </div>

      </main>
    </div>
  );
}