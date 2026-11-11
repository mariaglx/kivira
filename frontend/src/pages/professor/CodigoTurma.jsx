import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Gamepad2, Maximize, Minimize } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { useApi } from "../../controllers/useApi";
import { comemorar } from "../../utils/comemorar";

// Cada letra do código vira uma "peça" do tabuleiro, nas cores do Kivira —
// quem já jogou reconhece na hora. Texto sempre azul-escuro (branco reprova no coral).
const CORES_PECA = [
  "bg-coral [--sombra:var(--color-coral-escuro)]",
  "bg-laranja [--sombra:var(--color-laranja-escuro)]",
  "bg-laranja-claro [--sombra:var(--color-laranja-escuro)]",
];

// Avatares que ficam flutuando em volta do código, como se estivessem
// esperando a turma chegar. Posições fixas (não aleatórias) pra tela não
// "pular" a cada render e pra nunca cobrirem o código no centro.
const AVATARES = [
  { nome: "capivara", posicao: "top-[8%] left-[6%]", atraso: "0s" },
  { nome: "coruja", posicao: "top-[12%] right-[8%]", atraso: "1.2s" },
  { nome: "lontra", posicao: "bottom-[5%] left-[4%]", atraso: "0.6s" },
  { nome: "coelho", posicao: "bottom-[10%] right-[6%]", atraso: "1.8s" },
  { nome: "nave-lunar", posicao: "top-[45%] left-[2%]", atraso: "2.4s" },
  { nome: "girassol", posicao: "top-[42%] right-[3%]", atraso: "0.9s" },
];

// Formas soltas no fundo (bolinhas e peças) — puramente decorativas.
const FORMAS = [
  { classe: "w-24 h-24 rounded-full bg-laranja-claro/60", posicao: "top-[-2rem] left-[30%]" },
  { classe: "w-40 h-40 rounded-full bg-coral/25", posicao: "bottom-[-4rem] left-[35%]" },
  { classe: "w-14 h-14 rounded-2xl bg-azul/10 rotate-12", posicao: "top-[25%] left-[18%]" },
  { classe: "w-10 h-10 rounded-xl bg-coral/40 -rotate-12", posicao: "top-[22%] right-[22%]" },
  { classe: "w-16 h-16 rounded-2xl bg-laranja/50 rotate-6", posicao: "bottom-[28%] right-[18%]" },
  { classe: "w-8 h-8 rounded-full bg-verde/30", posicao: "bottom-[30%] left-[22%]" },
];

// Cabeçalho de cada passo: número no círculo azul + o que fazer
function Passo({ numero, children }) {
  return (
    <span className="flex items-center gap-3 text-xl sm:text-3xl font-extrabold font-display text-azul">
      <span className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-azul text-branco font-black flex items-center justify-center">
        {numero}
      </span>
      {children}
    </span>
  );
}

function useTelaCheia() {
  const [cheia, setCheia] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const atualizar = () => setCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", atualizar);
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);

  const alternar = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return { cheia, alternar, suportada: Boolean(document.documentElement.requestFullscreen) };
}

// Tela pra projetar na sala: só o código da turma gigante no centro, com a
// cara do jogo (peças, avatares, cores), pra criança entrar e já perceber que
// hoje tem Kivira. Aberta pelo "Exibir código" do card da turma. Fica fora do PainelLayout de propósito — sem menu, só o código.
export function CodigoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dados: turma, erro, carregando } = useApi(`/turma/${id}`);
  const { cheia, alternar, suportada } = useTelaCheia();
  const [copiado, setCopiado] = useState(false);

  // Confete de "boas-vindas" quando o código aparece (respeita reduced-motion)
  useEffect(() => {
    if (turma?.codigo_acesso) comemorar();
  }, [turma?.codigo_acesso]);

  if (carregando) return <Carregando texto="Preparando a sala..." />;

  if (erro || !turma?.codigo_acesso) {
    return (
      <main className="min-h-screen bg-bege flex items-center justify-center p-4">
        <EstadoVazio
          acao={<Button as={Link} to={`/professor/turmas/${id}`} tamanho="sm" variante="contorno">Voltar pra turma</Button>}
        >
          {erro || "Só o professor da turma pode mostrar o código."}
        </EstadoVazio>
      </main>
    );
  }

  const codigo = turma.codigo_acesso.toUpperCase();

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o código está na tela mesmo
    }
  };

  return (
    <main className="codigo-turma relative min-h-screen overflow-hidden bg-bege text-azul flex flex-col">
      {/* Fundo decorativo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {FORMAS.map((f, i) => (
          <span key={i} className={`absolute ${f.posicao} ${f.classe}`} />
        ))}
        {AVATARES.map((a) => (
          <img
            key={a.nome}
            src={`/avatares/${a.nome}.png`}
            alt=""
            style={{ animationDelay: a.atraso }}
            className={`flutuar hidden 2xl:block absolute ${a.posicao} w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-branco p-2 ring-4 ring-laranja-claro shadow-sm object-contain`}
          />
        ))}
      </div>

      {/* Controles do professor — discretos, no canto */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        {/* Volta pra onde o professor veio (lista de turmas ou a turma) */}
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/professor/turmas"))}
          className="alvo-toque text-sm text-azul/80 font-semibold flex items-center gap-1 w-fit"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex gap-2">
          <Button tamanho="sm" variante="contorno" onClick={copiar} className="gap-1.5">
            {copiado ? <Check size={14} /> : <Copy size={14} />}
            {copiado ? "Copiado!" : "Copiar código"}
          </Button>
          {suportada && (
            <Button tamanho="sm" variante="secundario" onClick={alternar} className="gap-1.5">
              {cheia ? <Minimize size={14} /> : <Maximize size={14} />}
              {cheia ? "Sair da tela cheia" : "Tela cheia"}
            </Button>
          )}
        </div>
      </header>

      <section className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 lg:gap-8 px-4 pb-10 text-center">
        <img
          src="/assets/logo.svg"
          alt="Kivira"
          className="h-12 sm:h-16 xl:h-20 w-auto animate__animated animate__bounceIn"
        />

        <div className="flex flex-col items-center gap-3">
          <span className="faixa-secao text-sm sm:text-base">
            <Gamepad2 size={18} aria-hidden="true" /> Turma {turma.nome}
          </span>
          <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-azul leading-tight">
            Vamos jogar Kivira hoje!
          </h1>
          <p className="text-lg sm:text-2xl font-bold text-azul/80 max-w-3xl">
            Siga os dois passos abaixo e prepare-se pra aventura.
          </p>
        </div>

        <ol className="w-full max-w-7xl flex flex-col gap-4 lg:gap-6">
          {/* Endereço lido do próprio navegador: em produção é kivira.vercel.app,
              e se o domínio mudar a tela acompanha sem precisar mexer aqui */}
          <li className="cartao rounded-[2rem] px-5 py-5 sm:px-10 sm:py-7 flex flex-col items-center gap-3 animate__animated animate__fadeInUp">
            <Passo numero={1}>Entre no site</Passo>
            <p className="font-display font-black text-coral-texto break-all text-3xl sm:text-5xl xl:text-6xl">
              {window.location.host}
            </p>
          </li>

          <li className="cartao rounded-[2rem] px-5 py-5 sm:px-10 sm:py-7 flex flex-col items-center gap-4 sm:gap-6 animate__animated animate__fadeInUp">
            <Passo numero={2}>Digite o código da turma</Passo>
            <p className="sr-only">{codigo.split("").join(" ")}</p>
            <div aria-hidden="true" className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {codigo.split("").map((letra, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${0.3 + i * 0.12}s` }}
                  className={`tatil animate__animated animate__flipInY ${CORES_PECA[i % CORES_PECA.length]} text-azul-escuro font-black font-display rounded-2xl lg:rounded-3xl flex items-center justify-center w-12 h-16 text-4xl sm:w-16 sm:h-20 sm:text-5xl lg:w-24 lg:h-32 lg:text-7xl xl:w-32 xl:h-40 xl:text-8xl`}
                >
                  {letra}
                </span>
              ))}
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}

export default CodigoTurma;
