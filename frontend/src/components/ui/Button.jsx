// Botão padrão do app (aluno, professor e admin). `variante` escolhe a cor,
// `tamanho` a escala. Todos os botões de ação são "táteis" (ver .tatil no
// index.css); só `fantasma` é chapado, pra ações discretas (fechar, cancelar).
const VARIANTES = {
  primario: "tatil bg-coral text-white [--sombra:var(--color-coral-escuro)]",
  secundario: "tatil bg-azul text-white [--sombra:var(--color-azul-escuro)]",
  contorno:
    "tatil bg-branco text-azul border border-azul/20 [--sombra:var(--color-cinza-claro)]",
  perigo:
    "tatil bg-vermelho text-white [--sombra:color-mix(in_srgb,var(--color-vermelho),black_30%)]",
  fantasma: "bg-transparent text-azul/70 hover:bg-azul/5 active:scale-95 transition",
};

const TAMANHOS = {
  md: "rounded-xl p-3 font-semibold",
  sm: "rounded-xl px-3 py-1.5 min-h-9 text-xs font-bold",
  icone: "rounded-full w-9 h-9 p-0 font-bold",
};

// `as` troca a tag (ex: as={Link} to="...") pra links com cara de botão.
export function Button({
  as: Tag = "button",
  children,
  variante = "primario",
  tamanho = "md",
  className = "",
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center ${VARIANTES[variante]} ${TAMANHOS[tamanho]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
