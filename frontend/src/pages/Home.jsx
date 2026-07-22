import React from "react";
import { LogoKivira } from "../components/LogoKivira";

export function Home() {
  return (
    <div className="min-h-screen bg-bege text-azul flex flex-col font-sans overflow-x-hidden">
      {/* 1. NAVBAR / HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center z-10">
        {/* Logo minimalista no canto caso queira, ou deixamos limpo */}
        <LogoKivira className="h-10 md:h-14 w-auto" />

        <div className="flex gap-3">
          <button className="btn bg-azul text-branco hover:bg-azul/90 border-none rounded-full px-5 py-2 text-sm normal-case font-semibold shadow-sm">
            Criar conta
          </button>
          <button className="btn bg-azul text-branco hover:bg-azul/90 border-none rounded-full px-5 py-2 text-sm normal-case font-semibold shadow-sm">
            Login
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION (Exatamente o seu design) */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-12 min-h-[80vh]">
        {/* Elementos Decorativos Flutuantes (Usando animate.css para dar vida) */}
        {/* Estrela Amarela */}
        <div className="absolute top-10 left-[15%] text-4xl text-laranja animate__animated animate__pulse animate__slower">
          ★
        </div>
        {/* Círculo Rosa Sólido */}
        <div className="absolute top-12 right-[15%] w-12 h-12 rounded-full bg-coral/80 animate__animated animate__bounce animate__slower"></div>

        {/* Círculo Vazado Coral e Bolinha Amarela */}
        <div className="absolute bottom-16 left-[12%] flex items-end gap-3">
          <div className="w-4 h-4 rounded-full bg-laranja"></div>
          <div className="w-14 h-14 rounded-full border-4 border-coral/60"></div>
        </div>

        {/* Quadrado Arredondado Escuro */}
        <div className="absolute bottom-16 right-[12%] w-10 h-10 bg-azul rounded-xl rotate-12 animate__animated animate__pulse animate__infinite animate__slower"></div>

        {/* Conteúdo Central */}
        <div className="max-w-2xl flex flex-col items-center gap-6 z-10">
          {/* Logo e Nome */}
          <div className="flex flex-col items-center gap-2">
            {/* Aqui entra o seu componente ou tag img do logo */}
            <div className="w-20 h-20 bg-branco/50 rounded-full flex items-center justify-center p-2 shadow-sm">
              <img
                src="/img/logo.png"
                className="object-contain animate__animated animate__fadeIn"
              />
            </div>
            <LogoKivira className="h-30 md:h-16 w-30 animate__animated animate__fadeIn" />
          </div>

          {/* Título Principal */}
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-azul">
            Aprender vira <br />
            <span className="text-coral text-6xl md:text-7xl block mt-2">
              diversão
            </span>
          </h2>

          {/* Botão de Ação */}
          <button className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-full px-8 py-4 text-lg font-bold shadow-lg shadow-coral/20 normal-case mt-4 transition-all hover:scale-105 active:scale-95">
            Jogar com código de sessão
          </button>
        </div>
      </section>

      {/* 3. SEÇÃO "COMO FUNCIONA" (Mais informações para o MVP) */}
      <section className="bg-branco/40 py-20 border-t border-branco/20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-xs uppercase tracking-widest font-bold text-coral mb-3">
            Passo a Passo
          </h3>
          <h4 className="text-3xl font-bold text-azul mb-12">
            Como jogar o Kivira?
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passo 1 */}
            <div className="flex flex-col items-center p-6 bg-branco/60 rounded-3xl shadow-sm border border-branco">
              <div className="w-12 h-12 rounded-full bg-azul text-branco flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h5 className="font-bold text-lg mb-2">Insira o Código</h5>
              <p className="text-sm text-azul/70">
                O professor ou responsável cria uma sessão e fornece um código
                simples para a criança digitar.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="flex flex-col items-center p-6 bg-branco/60 rounded-3xl shadow-sm border border-branco">
              <div className="w-12 h-12 rounded-full bg-coral text-branco flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h5 className="font-bold text-lg mb-2">Resolva o Tabuleiro</h5>
              <p className="text-sm text-azul/70">
                Arraste ou selecione as pecinhas certas para responder às
                perguntas do menu lateral.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="flex flex-col items-center p-6 bg-branco/60 rounded-3xl shadow-sm border border-branco">
              <div className="w-12 h-12 rounded-full bg-laranja text-branco flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h5 className="font-bold text-lg mb-2">Revele a Imagem!</h5>
              <p className="text-sm text-azul/70">
                Ao acertar todas as combinações, o tabuleiro vira e revela uma
                linda ilustração completa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER SIMPLE */}
      <footer className="w-full py-8 text-center text-xs text-azul/50 border-t border-branco/10">
        <p>© 2026 Kivira — Plataforma educacional gamificada.</p>
      </footer>
    </div>
  );
}
