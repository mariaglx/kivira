import { Link } from "react-router-dom";
import { paginaInicial } from "../services/sessao";

export function LogoKiviraRosa({ className = "h-auto w-auto" }) {
  return (
    <Link to={paginaInicial()} aria-label="Ir para a página inicial" className="inline-block shrink-0">
      <img src="/assets/logo-rosa.svg" alt="Kivira Logo" className={className} />
    </Link>
  );
}
