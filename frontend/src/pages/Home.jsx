import { useState, useRef } from "react";
import { LogoKivira } from "../components/LogoKivira";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { Ticket, Map, Trophy, Bot, BarChart3, Puzzle, Check, Lock, Blocks, ChevronDown, Smile, GraduationCap } from "lucide-react";

const AVATARES_VITRINE = ["girassol.png", "raposa.png", "gato-marsupial.png", "coelho.png", "fone-de-ouvido.png", "capivara.png"];

// Mini versão ilustrativa da Trilha de Fases do app do aluno — decorativa,
// sem dado real nem interação, só pra mostrar visitante o que a criança vê
// depois de entrar (ver TrilhaFases.jsx, o componente de verdade).
function TrilhaPreview() {
  return (
    <div className="relative w-full sm:max-w-xs md:max-w-sm">
      <div className="absolute inset-0 bg-coral/20 rounded-3xl blur-xl transform rotate-3"></div>
      <div className="relative bg-branco p-6 rounded-3xl shadow-2xl border border-cinza-claro">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-cinza-claro/60">
          <span className="w-2 h-2 rounded-full bg-coral"></span>
          <span className="text-xs font-extrabold text-azul/60 uppercase tracking-wider">
            Sua trilha
          </span>
        </div>

        <div className="relative h-72">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 280" preserveAspectRatio="none">
            <path
              d="M 50,40 Q 50,140 78,140 Q 78,240 24,240"
              fill="none"
              stroke="#eeb37f"
              strokeWidth="3"
              strokeDasharray="10 10"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Fase concluída */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: 40, left: "50%" }}>
            <div className="w-16 h-16 rounded-full bg-verde border-4 border-branco shadow-lg flex items-center justify-center">
              <Check size={26} className="text-branco" />
            </div>
            <p className="text-center text-amber-500 text-xs mt-1">⭐⭐⭐</p>
          </div>

          {/* Fase atual, liberada */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: 140, left: "78%" }}>
            <div className="w-20 h-20 rounded-full bg-coral border-4 border-branco shadow-lg flex items-center justify-center animate__animated animate__pulse animate__infinite">
              <Blocks size={30} className="text-branco" />
            </div>
          </div>

          {/* Fase bloqueada */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: 240, left: "24%" }}>
            <div className="w-16 h-16 rounded-full bg-cinza-claro border-4 border-branco shadow-lg flex items-center justify-center opacity-70">
              <Lock size={22} className="text-gray-400" />
            </div>
          </div>

          {/* Avatares flutuando pela trilha */}
          <img
            src="/avatares/girassol.png"
            alt=""
            className="absolute w-10 h-10 rounded-full shadow-md ring-2 ring-branco animate__animated animate__swing animate__infinite animate__slower"
            style={{ top: -6, left: "12%" }}
          />
          <img
            src="/avatares/raposa.png"
            alt=""
            className="absolute w-9 h-9 rounded-full shadow-md ring-2 ring-branco animate__animated animate__swing animate__infinite animate__slower"
            style={{ top: 96, left: "94%" }}
          />

          {/* Card flutuante de prévia da atividade — mesma área de coordenadas
              dos nódulos (0-280), numa faixa (y ≥ 205, lado direito) que não
              cruza nem a fase atual (termina em ~180) nem a bloqueada (fica
              do lado esquerdo, x 24%) */}
          <div className="absolute -right-6 w-36 bg-branco rounded-2xl shadow-xl border border-cinza-claro/30 p-3 rotate-3" style={{ top: 205 }}>
            <div className="w-full h-14 rounded-xl overflow-hidden mb-2">
              <img src="/img/resultado.png" alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-[11px] font-extrabold text-azul leading-tight">Sons dos Animais</p>
            <p className="text-[10px] text-azul/50 font-medium">🌿 Ciências</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const PASSOS = [
  {
    Icone: Ticket,
    cor: "bg-azul/10 text-azul",
    titulo: "Insira o Código da Sala",
    texto: "O professor cria a sessão pedagógica em segundos e compartilha o código com a turma.",
  },
  {
    Icone: Map,
    cor: "bg-coral/10 text-coral",
    titulo: "Avance na Trilha de Jogos",
    texto: "O aluno escolhe seu avatar e cumpre as missões encaixando as pecinhas no tabuleiro lúdico.",
  },
  {
    Icone: Trophy,
    cor: "bg-amber-100 text-amber-500",
    titulo: "Conquiste Medalhas e XP",
    texto: "A cada acerto, a ilustração é revelada e o aluno ganha recompensas no seu perfil!",
  },
];

const RECURSOS_PROFESSOR = [
  {
    Icone: Bot,
    cor: "bg-azul/10 text-azul",
    titulo: "Geração de Exercícios com IA",
    texto: "Crie atividades alinhadas ao conteúdo em instantes.",
  },
  {
    Icone: BarChart3,
    cor: "bg-coral/10 text-coral",
    titulo: "Acompanhamento em Tempo Real",
    texto: "Veja o progresso da turma e a evolução na trilha.",
  },
  {
    Icone: Puzzle,
    cor: "bg-verde/10 text-verde",
    titulo: "Inspirado no Método LÜK",
    texto: "Autocorreção e autonomia para o aluno aprender brincando.",
  },
];

export function Home() {
  const [sessionCode, setSessionCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [menuEntrarAberto, setMenuEntrarAberto] = useState(false);
  const navigate = useNavigate();
  const sessionCodeInputRef = useRef(null);

  const handleJoinSession = async (e) => {
    e.preventDefault();
    const cleanCode = sessionCode.trim();

    if (!cleanCode) {
      setError("Por favor, digite o código fornecido pelo professor.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const resultado = await apiRequest(
        `/turma/verificar-codigo/${encodeURIComponent(cleanCode.toLowerCase())}`
      );

      if (!resultado?.existe) {
        setError("Código não encontrado! Verifique com seu professor.");
        return;
      }

      // A turma existe, mas ainda não sabemos QUAL aluno está entrando —
      // isso só é possível depois que ele informar o usuário na próxima tela.
      navigate("/login_aluno", {
        state: { turmaCodigo: cleanCode.toLowerCase(), turmaNome: resultado.nome },
      });
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao validar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bege text-azul flex flex-col font-sans overflow-x-hidden relative">
      {/* 1. HEADER */}
      {/* Uma entrada por perfil: aluno (usuário + emojis) e professor (e-mail
          + senha, com o cadastro logo ao lado). O código de turma continua no
          card do hero — é por ele que o aluno faz o primeiro acesso. */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center gap-3 z-20">
        <LogoKivira className="h-10 sm:h-14 w-auto shrink-0" />

        {/* Tablet/desktop: os dois botões lado a lado */}
        <nav className="hidden sm:flex gap-3 items-center">
          <Link
            to="/login_aluno"
            className="tatil bg-coral text-branco rounded-full px-6 py-2.5 text-sm font-bold"
          >
            Sou aluno
          </Link>
          <Link
            to="/login"
            className="rounded-full px-6 py-2 text-sm font-bold text-azul border-2 border-azul/20 hover:bg-branco transition-colors"
          >
            Sou professor
          </Link>
        </nav>

        {/* Celular: um "Entrar" só, que abre a escolha de perfil — dois
            botões apertados ao lado da logo ficavam pequenos e confusos */}
        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setMenuEntrarAberto((v) => !v)}
            aria-expanded={menuEntrarAberto}
            className="tatil bg-coral text-branco rounded-full px-5 py-2.5 text-sm font-bold inline-flex items-center gap-1.5"
          >
            Entrar
            <ChevronDown size={16} className={`transition-transform ${menuEntrarAberto ? "rotate-180" : ""}`} />
          </button>

          {menuEntrarAberto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuEntrarAberto(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-branco rounded-2xl shadow-xl border border-cinza-claro/40 p-2 flex flex-col gap-1">
                <Link
                  to="/login_aluno"
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-bege/60"
                >
                  <span className="w-10 h-10 rounded-xl bg-coral/15 text-coral flex items-center justify-center shrink-0">
                    <Smile size={22} />
                  </span>
                  <span>
                    <span className="block font-bold text-azul">Sou aluno</span>
                    <span className="block text-xs text-azul/60">Entrar com meu usuário</span>
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-bege/60"
                >
                  <span className="w-10 h-10 rounded-xl bg-azul/10 text-azul flex items-center justify-center shrink-0">
                    <GraduationCap size={22} />
                  </span>
                  <span>
                    <span className="block font-bold text-azul">Sou professor</span>
                    <span className="block text-xs text-azul/60">E-mail e senha</span>
                  </span>
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-8 md:py-12 flex-1 flex items-center justify-center z-10 min-h-[75vh]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 items-center w-full">
          {/* COLUNA ESQUERDA: Chamada e entrada do aluno */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-azul mb-3">
              Aprender vira <br />
              <span className="text-coral text-5xl sm:text-6xl lg:text-7xl underline decoration-laranja-claro decoration-dashed decoration-3">
                diversão
              </span>
            </h1>

            <p className="text-azul/80 text-sm md:text-base lg:text-lg max-w-md font-medium leading-relaxed mb-8">
              Sua turma aprende jogando em uma trilha cheia de missões,
              pecinhas interativas e surpresas a cada acerto!
            </p>

            {/* CARD DE LOGIN DO ALUNO */}
            <div className="w-full max-w-md bg-branco p-5 rounded-3xl shadow-xl border border-cinza-claro">
              <p className="text-xs font-extrabold uppercase tracking-widest text-azul/50 mb-3">
                Já tem um código? Entre na sua sala
              </p>

              <form onSubmit={handleJoinSession} className="flex flex-col gap-3">
                <div className="relative flex flex-col gap-1">
                  <input
                    ref={sessionCodeInputRef}
                    type="text"
                    placeholder="CÓDIGO DA SESSÃO"
                    value={sessionCode}
                    onChange={(e) => {
                      setSessionCode(e.target.value.toUpperCase());
                      if (error) setError("");
                    }}
                    maxLength={8}
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
                  className="tatil w-full bg-coral text-branco rounded-2xl py-3 font-bold text-base disabled:opacity-50"
                >
                  {isLoading ? "Validando código..." : "Entrar na Sala 🚀"}
                </button>
              </form>

              <p className="mt-4 pt-4 border-t border-cinza-claro text-center text-sm text-azul/70 font-semibold">
                Já entrou antes?{" "}
                <Link to="/login_aluno" className="text-coral font-bold hover:underline">
                  Entrar com meu usuário →
                </Link>
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA: Preview da Trilha de Fases */}
          <div className="md:col-span-6 lg:col-span-5 flex justify-center items-center">
            <TrilhaPreview />
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
            {PASSOS.map(({ Icone, cor, titulo, texto }, i) => (
              <div
                key={i}
                className="group flex flex-col items-center p-8 bg-branco rounded-3xl shadow-sm border border-cinza-claro/60 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-orange-200/50"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${cor}`}>
                  <Icone size={26} strokeWidth={2.25} />
                </div>
                <h3 className="font-extrabold text-lg text-azul mb-2">{titulo}</h3>
                <p className="text-sm text-azul/70 leading-relaxed font-medium">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECURSOS PARA O PROFESSOR */}
      <section className="py-16 z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <span className="text-xs uppercase tracking-widest font-extrabold text-coral mb-2 block">
            Pra quem ensina
          </span>
          <h2 className="text-3xl font-black text-azul mb-12">
            Feito pra facilitar a vida do professor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {RECURSOS_PROFESSOR.map(({ Icone, cor, titulo, texto }, i) => (
              <div
                key={i}
                className="group flex flex-col items-center p-8 bg-branco rounded-3xl shadow-sm border border-cinza-claro/60 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-orange-200/50"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${cor}`}>
                  <Icone size={26} strokeWidth={2.25} />
                </div>
                <h3 className="font-extrabold text-lg text-azul mb-2">{titulo}</h3>
                <p className="text-sm text-azul/70 leading-relaxed font-medium">{texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/cadastro"
              className="tatil bg-coral text-branco rounded-full px-6 py-3 font-bold"
            >
              Criar conta de professor
            </Link>
            <Link
              to="/login"
              className="rounded-full px-6 py-3 font-bold text-azul border-2 border-azul/20 hover:bg-branco transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* 5. AVATARES E RECOMPENSAS */}
      <section className="bg-azul py-16 z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-3 sm:gap-5 mb-8 flex-wrap">
            {AVATARES_VITRINE.map((arquivo, i) => (
              <img
                key={arquivo}
                src={`/avatares/${arquivo}`}
                alt=""
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg ring-4 ring-laranja object-cover ${i % 2 ? "-rotate-3" : "rotate-3"}`}
              />
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-branco mb-3">
            Avatares pra chamar de seu ✨
          </h2>
          <p className="text-branco/70 font-medium max-w-lg mx-auto">
            Cada aluno tem seu próprio avatar e evolui no seu ritmo enquanto
            ganha conquistas!
          </p>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="w-full py-8 text-center text-xs text-azul/60 font-semibold border-t border-cinza-claro/40 z-10">
        <div className="flex justify-center gap-4 mb-3">
          <span className="hover:text-azul cursor-default">Termos de Uso</span>
          <span>|</span>
          <span className="hover:text-azul cursor-default">Política de Privacidade</span>
          <span>|</span>
          <span className="hover:text-azul cursor-default">Suporte ao Professor</span>
        </div>
        <p>© 2026 Kivira. Plataforma educacional gamificada.</p>
      </footer>
    </div>
  );
}

export default Home;
