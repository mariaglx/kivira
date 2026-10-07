// Avatar quadrado arredondado: a imagem de /avatares quando existe, senão a
// inicial do nome sobre o coral. Tamanho, raio e anel vêm por `className`.
export function Avatar({ arquivo, nome, className = "w-10 h-10 text-sm rounded-xl" }) {
  return (
    <div
      className={`${className} bg-coral overflow-hidden flex items-center justify-center font-bold text-branco uppercase shrink-0`}
    >
      {arquivo ? (
        <img src={`/avatares/${arquivo}`} alt="" className="w-full h-full object-cover" />
      ) : (
        (nome || "?").charAt(0)
      )}
    </div>
  );
}
