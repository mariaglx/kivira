// Peças compartilhadas pelas telas do professor (relatórios, turmas, atividades).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCopiar } from "../../controllers/useCopiar";
import { useFecharComEsc } from "../../controllers/useFecharComEsc";
import { Bike, BookMarked, BookOpen, Check, Copy, Ellipsis, Globe, Landmark, Languages, Leaf, Palette, Shapes } from "lucide-react";
import { corDisciplina, nomeDisciplina } from "../../utils/disciplina";

const STATUS = {
  concluido: { texto: "Concluiu", estilo: "bg-cie-bg text-cie-fg-escuro" },
  em_andamento: { texto: "Jogando", estilo: "bg-ouro-bg text-ouro-fg-escuro" },
  abandonado: { texto: "Não terminou", estilo: "bg-por-bg text-coral-texto" },
  nao_iniciado: { texto: "Não começou", estilo: "bg-cinza-claro text-azul" },
};

export function SeloStatus({ status }) {
  return <Chip className={STATUS[status].estilo}>{STATUS[status].texto}</Chip>;
}

export function Chip({ className = "bg-bege text-azul", children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

export function Indicador({ rotulo, valor }) {
  return (
    <div className="cartao rounded-2xl p-4 flex flex-col gap-1">
      <span className="rotulo">{rotulo}</span>
      <span className="text-2xl font-extrabold text-azul">{valor}</span>
    </div>
  );
}

// Números de resumo numa faixa branca só: valor grande seguido do rótulo.
export function FaixaIndicadores({ itens }) {
  return (
    <section className="cartao rounded-2xl px-5 py-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
      {itens.map(({ valor, rotulo }) => (
        <p key={rotulo} className="flex items-baseline gap-1.5">
          <span className="font-display font-black text-xl sm:text-2xl text-azul">{valor}</span>
          <span className="text-sm font-bold text-azul/80">{rotulo}</span>
        </p>
      ))}
    </section>
  );
}

const ICONES = { Bike, BookMarked, BookOpen, Globe, Landmark, Languages, Leaf, Palette, Shapes };

export function IconeDisciplina({ disciplina, size = 22, className = "" }) {
  const Icone = ICONES[corDisciplina(disciplina).icone];
  return <Icone size={size} className={className} aria-hidden="true" />;
}

// Quadrado com a capa da atividade; sem capa, a cor e o ícone da disciplina.
export function TileDisciplina({ disciplina, imagem, className = "w-12 h-12 rounded-2xl", tamanhoIcone = 22 }) {
  const cor = corDisciplina(disciplina);
  return (
    <div className={`shrink-0 overflow-hidden flex items-center justify-center ${cor.bg} ${cor.fg} ${className}`}>
      {imagem ? (
        <img src={imagem} alt="" className="w-full h-full object-cover" />
      ) : (
        <IconeDisciplina disciplina={disciplina} size={tamanhoIcone} />
      )}
    </div>
  );
}

export function ChipDisciplina({ disciplina }) {
  if (!disciplina) return null;
  return <Chip className={corDisciplina(disciplina).chip}>{nomeDisciplina(disciplina)}</Chip>;
}

// Barra fina de conclusão (verde sobre cinza).
export function BarraConclusao({ valor, max, className = "" }) {
  const proporcao = max > 0 ? Math.min(valor / max, 1) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-2 rounded-full bg-cinza-claro overflow-hidden ${className}`}
    >
      <div className="h-full rounded-full bg-verde" style={{ width: `${proporcao * 100}%` }} />
    </div>
  );
}

// Um segmento por aluno: verde pra quem concluiu.
export function BarraSegmentos({ valor, max, className = "w-24" }) {
  if (!max) return null;
  return (
    <div role="img" aria-label={`${valor} de ${max} concluíram`} className={`flex gap-1 ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-2 flex-1 rounded-full ${i < valor ? "bg-verde" : "bg-cinza-claro"}`} />
      ))}
    </div>
  );
}

// Código de acesso em chip com botão Copiar.
export function CodigoCopiavel({ codigo, className = "bg-branco border border-cinza-claro" }) {
  const { copiado, copiar } = useCopiar();
  if (!codigo) return null;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-0.5 text-xs font-bold ${className}`}>
      Código <b className="font-mono tracking-[0.12em] text-sm">{codigo}</b>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          copiar(codigo);
        }}
        className="alvo-toque inline-flex items-center gap-1 border-l border-current/20 pl-2 pr-2 py-1 text-coral-texto font-extrabold"
        aria-label={`Copiar o código ${codigo}`}
      >
        {copiado ? <Check size={14} /> : <Copy size={14} />}
        <span aria-live="polite">{copiado ? "Copiado" : "Copiar"}</span>
      </button>
    </span>
  );
}

// Botão de filtro em pílula (mesmo visual das abas da página da turma).
export function Filtro({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`px-4 min-h-11 flex items-center gap-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${
        ativo ? "bg-coral text-azul-escuro" : "bg-branco text-azul border border-cinza-claro hover:border-coral"
      }`}
    >
      {children}
    </button>
  );
}

// Menu de três pontos. `itens`: [{ rotulo, Icone, to?, onClick?, perigo? }].
// Fecha no Esc (devolve o foco pro botão), no clique fora e ao escolher.
export function MenuMais({ rotulo, itens, acima = false }) {
  const [aberto, setAberto] = useState(false);
  const refBotao = useRef(null);
  const refMenu = useRef(null);
  const fechar = () => setAberto(false);
  useFecharComEsc(aberto, fechar, refBotao);

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (e) => {
      if (!refMenu.current?.contains(e.target) && !refBotao.current?.contains(e.target)) setAberto(false);
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  const classeItem = "w-full flex items-center gap-2.5 px-3 min-h-11 rounded-lg text-sm font-bold text-left hover:bg-bege/60";
  return (
    <div className="relative">
      <button
        ref={refBotao}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="alvo-toque w-9 h-9 rounded-lg flex items-center justify-center text-azul hover:bg-azul/5"
      >
        <Ellipsis size={20} />
      </button>
      {aberto && (
        <div
          ref={refMenu}
          role="menu"
          className={`absolute right-0 z-20 w-52 bg-branco rounded-xl shadow-xl border border-cinza-claro p-1 ${acima ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {itens.map(({ rotulo: texto, Icone, to, onClick, perigo }) => {
            const classe = `${classeItem} ${perigo ? "text-vermelho" : "text-azul"}`;
            const conteudo = (
              <>
                <Icone size={16} /> {texto}
              </>
            );
            return to ? (
              <Link key={texto} role="menuitem" to={to} className={classe}>
                {conteudo}
              </Link>
            ) : (
              <button key={texto} role="menuitem" type="button" className={classe} onClick={() => { fechar(); onClick(); }}>
                {conteudo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
