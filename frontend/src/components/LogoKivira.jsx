import { Link } from "react-router-dom";
import { paginaInicial } from "../services/sessao";

// O logo sempre leva pra página inicial de quem está logado (aluno, professor, admin).
export function LogoKivira({ className = "h-auto w-auto" }) {
  return (
    <Link to={paginaInicial()} aria-label="Ir para a página inicial" className="inline-block shrink-0">
      <img src="/assets/logo.svg" alt="Kivira Logo" className={className} />
    </Link>
  );
}
