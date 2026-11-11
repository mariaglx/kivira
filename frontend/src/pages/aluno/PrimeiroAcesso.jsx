import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { usePrimeiroAcesso } from "../../controllers/usePrimeiroAcesso";
import { Alerta } from "../../components/ui/Alerta";

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
      navigate("/login_aluno", { replace: true });
    }
  }, [username, navigate]);

  if (!username) return null;

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-8 sm:px-10 rounded-3xl shadow-lg w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-6">
          <LogoKivira className="h-16 w-auto animate__animated animate__bounceIn" />
          <h2 className="text-xl md:text-2xl font-bold text-azul text-center">
            Vamos criar sua senha especial! 🎉
          </h2>
          <p className="text-sm text-azul/80 text-center">
            Olá, <strong>{username}</strong>! Primeiro, digite a senha que seu
            professor te deu. Depois, escolha 3 emojis pra ser sua nova senha.
          </p>
        </div>

        {erro && (
          <Alerta className="mb-4 text-center justify-center">
            {erro}
          </Alerta>
        )}

        <form onSubmit={confirmar} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="campo-senha-temporaria-dada-pelo-professor" className="text-start text-azul/80 text-base font-medium">
              Senha temporária (dada pelo professor)
            </label>
            <Input id="campo-senha-temporaria-dada-pelo-professor"
              type="password"
              placeholder="Senha temporária"
              value={senhaTemporaria}
              onChange={(e) => setSenhaTemporaria(e.target.value)}
              className="text-base py-3 px-4"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-start text-azul/80 text-base font-medium">
              Escolha 3 emojis pra sua nova senha
            </span>
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
