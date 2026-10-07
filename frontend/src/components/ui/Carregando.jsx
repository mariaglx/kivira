export function Carregando({ texto = "Carregando..." }) {
  return (
    <main className="flex-1 flex items-center justify-center py-16">
      <p className="text-azul font-bold text-lg">{texto}</p>
    </main>
  );
}
