import React from "react";

export function Dashboard() {
  // Dados mockados para popular a tabela de turmas
  const turmasRecentes = [
    { id: 1, nome: "3º Ano A — Matemática", ano: "3º Ano", alunos: 18, atividades: 5, status: "Ativa" },
    { id: 2, nome: "4º Ano B — Português", ano: "4º Ano", alunos: 15, atividades: 3, status: "Ativa" },
    { id: 3, nome: "2º Ano A — Ciências", ano: "2º Ano", alunos: 14, atividades: 4, status: "Pausada" },
  ];

  return (
    <div className="flex min-h-screen bg-bege text-azul font-sans">
      
      {/* 1. SIDEBAR (Barra Lateral Esquerda) */}
      <aside className="w-64 bg-[#1e2a38] text-branco flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <img
                src="/img/logo.png" alt="Logo" className="w-7 h-7"></img>
            <span className="font-extrabold tracking-widest text-lg text-branco">KIVIRA</span>
          </div>

          {/* Menu de Navegação */}
          <nav className="flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Menu</span>
            <ul className="flex flex-col gap-2">
              {/* Item Ativo */}
              <li>
                <a href="#dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-branco/10 text-branco font-medium transition-all relative">
                  <span className="w-2 h-2 rounded-full bg-coral absolute left-2"></span>
                  <span className="pl-2">Dashboard</span>
                </a>
              </li>
              {/* Outros Itens */}
              <li>
                <a href="#turmas" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Turmas
                </a>
              </li>
              <li>
                <a href="#atividades" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Atividades
                </a>
              </li>
              <li>
                <a href="#configuracoes" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-branco/5 hover:text-branco transition-all font-medium">
                  • Configurações
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Perfil do Professor (Rodapé da Sidebar) */}
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

      {/* 2. ÁREA PRINCIPAL DO DASHBOARD */}
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        
        {/* Cabeçalho do Painel */}
        <header className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          {/* Pill de Data do seu Mockup */}
          <div className="bg-branco/80 border border-cinza-claro/20 text-azul/80 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
            18 de maio de 2026
          </div>
        </header>

        {/* Boas-vindas */}
        <div>
          <h3 className="text-3xl font-extrabold flex items-center gap-2">
            Bom dia, Professor(a)!
          </h3>
          <p className="text-sm text-azul/60 mt-1">Veja o resumo das suas turmas e atividades</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Turmas */}
          <div className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 relative overflow-hidden flex flex-col gap-1">
            <div className="w-10 h-1 bg-coral rounded-full absolute top-4 left-6"></div>
            <span className="text-4xl font-extrabold text-azul mt-2">3</span>
            <span className="text-xs font-medium text-azul/50">Turmas ativas</span>
          </div>

          {/* Card 2: Atividades */}
          <div className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 relative overflow-hidden flex flex-col gap-1">
            <div className="w-10 h-1 bg-laranja rounded-full absolute top-4 left-6"></div>
            <span className="text-4xl font-extrabold text-azul mt-2">12</span>
            <span className="text-xs font-medium text-azul/50">Atividades criadas</span>
          </div>

          {/* Card 3: Alunos */}
          <div className="bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 relative overflow-hidden flex flex-col gap-1">
            <div className="w-10 h-1 bg-green-500 rounded-full absolute top-4 left-6"></div>
            <span className="text-4xl font-extrabold text-azul mt-2">47</span>
            <span className="text-xs font-medium text-azul/50">Alunos</span>
          </div>
        </div>

        {/* Seção de Ações Rápidas */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm uppercase tracking-wider font-bold text-azul/60">Ações rápidas</h4>
          <div className="flex gap-4">
            <button className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-3 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95">
              + Criar Sala
            </button>
            <button className="btn bg-[#1e2a38] hover:bg-[#28384b] text-branco border-none rounded-xl px-6 py-3 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95">
              + Criar Atividade
            </button>
          </div>
        </div>

        {/* Tabela de Turmas Recentes */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm uppercase tracking-wider font-bold text-azul/60">Turmas recentes</h4>
            <a href="#todas-turmas" className="text-xs font-bold text-coral hover:underline flex items-center gap-1">
              Ver todas →
            </a>
          </div>

          {/* Tabela DaisyUI customizada */}
          <div className="overflow-x-auto bg-branco rounded-2xl shadow-sm border border-cinza-claro/10">
            <table className="table w-full text-left">
              <thead>
                <tr className="border-b border-cinza-claro/30 text-azul/40 text-xs uppercase">
                  <th className="py-4 px-6 font-semibold">Turma</th>
                  <th className="py-4 px-6 font-semibold">Ano</th>
                  <th className="py-4 px-6 font-semibold">Alunos</th>
                  <th className="py-4 px-6 font-semibold">Atividades</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-azul/80">
                {turmasRecentes.map((turma, i) => (
                  <tr 
                    key={turma.id} 
                    className={`hover:bg-bege/10 transition-colors border-b border-cinza-claro/20 last:border-none`}
                  >
                    <td className="py-4 px-6 font-semibold">{turma.nome}</td>
                    <td className="py-4 px-6">{turma.ano}</td>
                    <td className="py-4 px-6 font-medium">{turma.alunos}</td>
                    <td className="py-4 px-6 font-medium">{turma.atividades}</td>
                    <td className="py-4 px-6">
                      {turma.status === "Ativa" ? (
                        <span className="badge bg-green-100 text-green-600 border-none rounded-md px-2.5 py-1 text-xs font-bold">
                          Ativa
                        </span>
                      ) : (
                        <span className="badge bg-red-100 text-red-500 border-none rounded-md px-2.5 py-1 text-xs font-bold">
                          Pausada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}