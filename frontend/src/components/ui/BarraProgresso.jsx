// Barra de progresso reutilizável. `segmentos` desenha um pedaço por unidade
// (bom pra "3 de 6 peças"); sem ele, uma barra contínua (bom pra XP).
export function BarraProgresso({
  valor,
  max,
  segmentos = false,
  trilha = "bg-azul/15",
  preenchimento = "bg-coral",
  className = "",
}) {
  const proporcao = max > 0 ? Math.min(valor / max, 1) : 0;

  if (segmentos) {
    return (
      <div
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`flex gap-1 ${className}`}
      >
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`h-3 flex-1 rounded-full transition-all duration-300 ${
              i < valor ? `${preenchimento} scale-y-125` : trilha
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-3 w-full rounded-full overflow-hidden ${trilha} ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-700 ${preenchimento}`}
        style={{ width: `${proporcao * 100}%` }}
      />
    </div>
  );
}
