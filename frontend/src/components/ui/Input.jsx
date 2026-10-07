// Campo de texto padrão. `icone` (componente lucide) desenha o ícone à esquerda.
export function Input({
  type = "text",
  placeholder,
  icone: Icone,
  className = "",
  ...props
}) {
  const campo = (
    <input
      type={type}
      placeholder={placeholder}
      className={`border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul focus:ring-2 focus:ring-coral/20 transition ${
        Icone ? "w-full pl-9" : ""
      } ${className}`}
      {...props}
    />
  );
  if (!Icone) return campo;
  return (
    <div className="relative w-full">
      <Icone
        size={16}
        className="absolute inset-y-0 left-3 my-auto text-azul/40 pointer-events-none"
      />
      {campo}
    </div>
  );
}
