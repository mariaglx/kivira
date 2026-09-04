import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { usePrimeiroAcesso } from "../../controllers/usePrimeiroAcesso";

export function PrimeiroAcesso() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;

  const {
    senhaTemporaria,
    setSenhaTemporaria,
    emojis,
    alternarEmoji,
    erro,
    carregando,
    confirmar,
  } = usePrimeiroAcesso(username);

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
            Vamos criar sua senha especial! 🎉
          </h2>
          <p className="text-sm text-azul/60 text-center">
            Olá, <strong>{username}</strong>! Primeiro, digite a senha que seu
            professor te deu. Depois, escolha 3 emojis pra ser sua nova senha.
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={confirmar} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-start text-gray-600 text-base font-medium">
              Senha temporária (dada pelo professor)
            </label>
            <Input
              type="password"
              placeholder="Senha temporária"
              value={senhaTemporaria}
              onChange={(e) => setSenhaTemporaria(e.target.value)}
              className="text-base py-3 px-4"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-start text-gray-600 text-base font-medium">
              Escolha 3 emojis pra sua nova senha
            </label>
            <SeletorEmoji selecionados={emojis} onAlternar={alternarEmoji} />
          </div>

          <Button type="submit" disabled={carregando}>
            {carregando ? "Confirmando..." : "Confirmar e continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default PrimeiroAcesso;
