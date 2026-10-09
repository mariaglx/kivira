// Lista vazia padrão: cartão centralizado com texto e, opcionalmente, uma ação.
export function EstadoVazio({ children, acao, className = "" }) {
  return (
    <div className={`cartao text-center py-10 px-6 ${className}`}>
      <p className="text-azul/60 text-sm">{children}</p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
