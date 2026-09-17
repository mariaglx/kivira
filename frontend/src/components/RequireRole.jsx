import { Navigate, Outlet, useLocation } from "react-router-dom";

// Guarda de rota: sem isso, qualquer usuário logado (mesmo um aluno) podia
// digitar /professor ou /admin na barra de endereço e a tela inteira montava
// e disparava requisições que só o backend barrava (401/403) — nenhum feedback
// antes disso, só erros aparecendo em cascata na tela.
//
// Não decodifica o JWT nem checa expiração — só confere o que o próprio login
// já guardou em localStorage.user_type. Um token expirado ainda é pego pelos
// handlers de 401 que cada página já tem (removem o token e mandam pro login).
export function RequireRole({ allowedRoles }) {
  const location = useLocation();
  const temToken = !!localStorage.getItem("access_token");
  const tipoUsuario = localStorage.getItem("user_type");

  if (!temToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(tipoUsuario)) {
    // Logado, mas na área errada — manda pra home do próprio papel em vez de
    // pro login (a pessoa já está autenticada, só não tem acesso aqui)
    if (tipoUsuario === "admin") return <Navigate to="/admin" replace />;
    if (tipoUsuario === "professor") return <Navigate to="/professor" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
