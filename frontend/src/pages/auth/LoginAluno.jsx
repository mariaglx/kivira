import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { apiRequest } from "../../services/api";

export function LoginAluno() {
  const location = useLocation();
  const navigate = useNavigate();
  const turmaCodigo = location.state?.turmaCodigo;
  const turmaNome = location.state?.turmaNome;

  const [username, setUsername] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Esse fluxo depende do código da turma já validado na Home — sem ele não
  // há como checar se o usuário pertence a essa turma
  useEffect(() => {
    if (!turmaCodigo) {
      navigate("/", { replace: true });
    }
  }, [turmaCodigo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErro("Informe seu nome de usuário.");
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      const status = await apiRequest(
        `/aluno/status-acesso?username=${encodeURIComponent(username.trim())}&codigo_turma=${encodeURIComponent(turmaCodigo)}`
      );

      if (status.primeiro_acesso) {
        navigate("/primeiro_acesso", {
          state: { username: username.trim(), turmaCodigo },
        });
      } else {
        navigate("/login_emoji", {
          state: { username: username.trim(), turmaCodigo },
        });
      }
    } catch (err) {
      setErro(err.message || "Usuário não encontrado nessa turma.");
    } finally {
      setCarregando(false);
    }
  };

  if (!turmaCodigo) return null;

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-10 rounded-3xl shadow-lg w-full max-w-md md:max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-6">
          <LogoKivira className="h-16 md:h-20 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-700">
            Entrar na turma
          </h2>
          {turmaNome && (
            <p className="text-sm text-azul/60 font-semibold">{turmaNome}</p>
          )}
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-start text-gray-600 text-base font-medium">
              Insira seu nome de usuário
            </label>
            <Input
              type="text"
              placeholder="Ex: joao.silva"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-base py-3 px-4"
              autoFocus
            />
          </div>

          <Button type="submit" disabled={carregando}>
            {carregando ? "Verificando..." : "Continuar"}
          </Button>

          <div className="flex flex-col gap-2 mt-2">
            <p className="text-center text-gray-600 text-base">
              Não tem conta?{" "}
              <Link
                to="/cadastro"
                className="text-azul font-bold hover:underline cursor-pointer"
              >
                Solicitar acesso
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginAluno;
