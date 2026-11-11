// Aviso de erro padrão: `alert` do daisyUI (cor `error` = nosso vermelho no
// tema) com role="alert", pra o leitor de tela anunciar assim que aparece.
export function Alerta({ children, className = "" }) {
  return (
    <div role="alert" className={`alert alert-error alert-soft rounded-xl text-sm ${className}`}>
      {children}
    </div>
  );
}
