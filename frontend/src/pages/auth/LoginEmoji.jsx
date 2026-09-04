import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { useLoginEmoji } from "../../controllers/useLoginEmoji";

export function LoginEmoji() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const { emojis, alternarEmoji, erro, carregando, entrar } =
    useLoginEmoji(username);

  useEffect(() => {
    if (!username) {
      navigate("/", { replace: true });
    }
  }, [username, navigate]);

  if (!username) return null;

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-8 sm:px-10 rounded-3xl shadow-lg w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-6">
          <LogoKivira className="h-16 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-700 text-center">
            Oi, {username}! Digite sua senha de emojis 🔐
          </h2>
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={entrar} className="flex flex-col gap-6">
          <SeletorEmoji selecionados={emojis} onAlternar={alternarEmoji} />

          <Button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginEmoji;
