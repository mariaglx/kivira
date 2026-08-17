import React, { useState } from "react";
import { LogoKivira } from "../components/LogoKivira";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function Home() {
  const [sessionCode, setSessionCode] = useState("");
  const [activeTab, setActiveTab] = useState("aluno"); // "aluno" | "professor"
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinSession = async (e) => {
    e.preventDefault();
    const cleanCode = sessionCode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Por favor, digite o código fornecido pelo professor.");
      return;
    }

    if (cleanCode.length < 6) {
      setError("O código deve ter 6 caracteres.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // TODO: Substituir por sua chamada real de API (ex: await api.get(`/sessoes/validar/${cleanCode}`))
      // Exemplo simulado:
      const sessionData = await validarCodigoSessaoAPI(cleanCode);

      if (!sessionData || !sessionData.exists) {
        // MENSAGEM DE RETORNO QUANDO O CÓDIGO NÃO FOR VÁLIDO:
        setError("Código não encontrado! Verifique com seu professor.");
        setIsLoading(false);
        return;
      }

      // Regra do primeiro acesso:
      if (sessionData.isFirstLogin) {
        // Envia para o LoginAluno (primeiro acesso) levando o código no state
        navigate("/login-aluno", { state: { sessionCode: cleanCode } });
      } else {
        // Se já cadastrou o perfil no primeiro acesso, vai para a seleção/login com emojis
        navigate("/login-emoji", { state: { sessionCode: cleanCode } });
      }
    } catch (err) {
      setError("Ocorreu um erro ao validar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função mock/simulada (remova quando integrar seu axios/fetch real)
  const validarCodigoSessaoAPI = async (code) => {
    // Simula atraso da rede
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Exemplo de teste: CÓDIGO "ABC123" simula primeiro login
    if (code === "ABC123") {
      return { exists: true, isFirstLogin: true };
    }
    // Exemplo de teste: CÓDIGO "XYZ999" simula aluno que já configurou a conta
    if (code === "XYZ999") {
      return { exists: true, isFirstLogin: false };
    }

    // Qualquer outro código por enquanto simula código válido com primeiro acesso
    return { exists: true, isFirstLogin: true };
  };

  return (
    <div className="min-h-screen bg-bege text-azul flex flex-col font-sans overflow-x-hidden relative">
      {/* 1. HEADER LIMPO E FUNCIONAL */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-20">
        <LogoKivira className="h-16 md:h-15 w-auto" />

        <div className="flex gap-3 items-center">
          <Link
            to="/login"
            className="btn btn-ghost text-azul hover:bg-branco/50 rounded-full px-5 text-sm font-semibold"
          >
            Área do Professor
          </Link>
          <Link
            to="/login-aluno"
            className="btn btn-primary rounded-full px-6 shadow-sm hover:scale-105 transition-all text-sm font-bold"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION REESTRUTURADA */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-8 md:py-12 flex-1 flex items-center justify-center z-10 min-h-[75vh]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-6 items-center w-full">
          {/* COLUNA ESQUERDA: Chamada e Ação de Entrada */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-azul mb-3">
              Aprender vira <br />
              <span className="text-coral text-5xl sm:text-6xl lg:text-7xl underline decoration-laranja-claro decoration-dashed decoration-3">
                diversão
              </span>
            </h1>

            <p className="text-azul/80 text-sm md:text-base lg:text-lg max-w-md font-medium leading-relaxed mb-8">
              Encaixe as pecinhas no tabuleiro, responda às perguntas do
              professor e revele ilustrações incríveis a cada acerto!
            </p>

            {/* CARD DE AÇÃO */}
            <div className="w-full max-w-md bg-branco/80 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-cinza-claro">
              {/* Abas de Navegação */}
              <div className="flex bg-bege/60 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("aluno");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    activeTab === "aluno"
                      ? "bg-branco text-coral shadow-sm"
                      : "text-azul/60 hover:text-azul"
                  }`}
                >
                  <span>Sou Aluno </span>
                  <FontAwesomeIcon icon={["fas", "user-graduate"]} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("professor");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    activeTab === "professor"
                      ? "bg-branco text-azul shadow-sm"
                      : "text-azul/60 hover:text-azul"
                  }`}
                >
                  <span>Sou Professor </span>
                  <FontAwesomeIcon icon={["fas", "chalkboard-user"]} />
                </button>
              </div>

              {/* Conteúdo da Aba do Aluno */}
              {activeTab === "aluno" ? (
                <form
                  onSubmit={handleJoinSession}
                  className="flex flex-col gap-3"
                >
                  <div className="relative flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="CÓDIGO DA SESSÃO"
                      value={sessionCode}
                      onChange={(e) => {
                        setSessionCode(e.target.value.toUpperCase());
                        if (error) setError("");
                      }}
                      maxLength={6}
                      disabled={isLoading}
                      className={`w-full bg-bege/40 border-2 ${
                        error
                          ? "border-red-500 focus:border-red-500"
                          : "border-cinza-claro focus:border-coral"
                      } rounded-2xl py-3 px-4 text-azul placeholder:text-azul/30 font-black tracking-widest text-center text-lg uppercase outline-none transition-all`}
                    />
                    {error && (
                      <span className="flex items-center justify-center gap-2 bg-red-100 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-center animate-bounce-short">
                        {error}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full rounded-2xl py-3 font-bold text-branco text-base shadow-lg shadow-coral/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Validando Código..." : "Entrar na Sala"}
                  </button>
                </form>
              ) : (
                /* Conteúdo da Aba do Professor */
                <div className="flex flex-col gap-3 text-center py-2">
                  <p className="text-xs text-azul/80 font-medium flex-wrap">
                    Crie tabuleiros personalizados e acompanhe o progresso da
                    sua turma em tempo real.
                  </p>
                  <Link
                    to="/login"
                    className="btn btn-secondary w-full rounded-2xl py-3 font-bold text-branco text-base shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Criar Nova Turma
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: Preview do Tabuleiro */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full sm:max-w-xs md:max-w-sm">
              <div className="absolute inset-0 bg-coral/20 rounded-3xl blur-xl transform rotate-3"></div>
              <div className="relative bg-branco p-4 md:p-6 rounded-3xl shadow-2xl border border-cinza-claro">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-cinza-claro/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-coral"></span>
                    <span className="text-xs font-extrabold text-azul/60 uppercase tracking-wider">
                      Tabuleiro #01
                    </span>
                  </div>
                  <span className="badge badge-accent text-xs font-bold text-azul px-3 py-2 rounded-lg">
                    Fácil
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 aspect-square mb-5 bg-bege/50 p-3 rounded-2xl border border-bege">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => {
                    const isSolved = item <= 4;
                    return (
                      <div
                        key={item}
                        className={`rounded-xl flex items-center justify-center font-extrabold text-sm transition-all duration-300 ${
                          isSolved
                            ? "bg-coral text-branco shadow-md shadow-coral/30 scale-[0.96]"
                            : "bg-branco text-azul/40 border-2 border-dashed border-azul/15 hover:border-coral/50"
                        }`}
                      >
                        {isSolved ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          item
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-azul font-bold">
                    <span>Progresso do Tabuleiro</span>
                    <span className="text-coral font-black">44%</span>
                  </div>
                  <div className="w-full bg-bege h-2.5 rounded-full overflow-hidden p-0.5">
                    <div className="bg-coral h-full rounded-full w-[44%] transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO PASSO A PASSO */}
      <section className="bg-branco/50 py-16 border-t border-branco/30 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs uppercase tracking-widest font-extrabold text-coral mb-2 block">
            Passo a Passo
          </span>
          <h2 className="text-3xl font-black text-azul mb-12">
            Como funciona o Kivira?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-8 bg-branco rounded-3xl shadow-sm border border-cinza-claro/60 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-azul text-branco flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-azul/20">
                1
              </div>
              <h3 className="font-extrabold text-lg text-azul mb-2">
                Insira o Código
              </h3>
              <p className="text-sm text-azul/70 leading-relaxed font-medium">
                O professor cria uma sessão e compartilha um código simples com
                a turma.
              </p>
            </div>

            <div className="flex flex-col items-center p-8 bg-branco rounded-3xl shadow-sm border border-cinza-claro/60 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-coral text-branco flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-coral/20">
                2
              </div>
              <h3 className="font-extrabold text-lg text-azul mb-2">
                Resolva o Tabuleiro
              </h3>
              <p className="text-sm text-azul/70 leading-relaxed font-medium">
                Encaixe as pecinhas certas para responder às perguntas
                pedagógicas.
              </p>
            </div>

            <div className="flex flex-col items-center p-8 bg-branco rounded-3xl shadow-sm border border-cinza-claro/60 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-laranja text-branco flex items-center justify-center font-black text-xl mb-4 shadow-md shadow-laranja/20">
                3
              </div>
              <h3 className="font-extrabold text-lg text-azul mb-2">
                Revele a Imagem!
              </h3>
              <p className="text-sm text-azul/70 leading-relaxed font-medium">
                Ao completar o desafio, o tabuleiro vira e revela a ilustração
                inteira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="w-full py-8 text-center text-xs text-azul/60 font-semibold border-t border-cinza-claro/40 z-10">
        <p>© 2026 Kivira — Plataforma educacional gamificada.</p>
      </footer>
    </div>
  );
}
