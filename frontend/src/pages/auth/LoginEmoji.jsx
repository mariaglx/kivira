import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { SeletorEmoji } from "../../components/aluno/SeletorEmoji";
import { UserIcon } from "../../components/icons/user";
import { useLoginEmoji } from "../../controllers/useLoginEmoji";

export function LoginEmoji() {
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;
  const avatarUrl = location.state?.avatarUrl;

  const { emojis, alternarEmoji, erro, carregando, entrar } =
    useLoginEmoji(username);

  // Sem username não há conta pra entrar — volta pra tela que pergunta o nome
  useEffect(() => {
    if (!username) {
      navigate("/login_aluno", { replace: true });
    }
  }, [username, navigate]);

  if (!username) return null;

  // O sistema gera vinicius.wille, vinicius.wille2, vinicius.wille3… quando dois
  // alunos têm o mesmo nome (gerar_username_unico, backend/routes/aluno.py). Esse
  // número final é a ÚNICA coisa que separa uma criança da outra, então ele sai
  // em coral — sem isso, "senha incorreta" pode na verdade significar "você está
  // tentando entrar na conta do seu colega", e ninguém tem como perceber.
  const sufixo = username.match(/\d+$/)?.[0] ?? "";
  const nomeBase = sufixo ? username.slice(0, -sufixo.length) : username;

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-8 sm:px-10 rounded-3xl shadow-lg w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-5">
          <LogoKivira className="h-16 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-azul text-center">
            Digite sua senha de emojis
          </h2>
        </div>

        {/* Crachá da conta: mostra em quem a criança está tentando entrar */}
        <div className="flex items-center gap-3.5 bg-bege border-2 border-laranja-claro rounded-2xl p-2.5 mb-6">
          {avatarUrl ? (
            <img
              src={`/avatares/${avatarUrl}`}
              alt=""
              className="w-14 h-14 rounded-2xl bg-branco border-2 border-coral object-cover shrink-0"
            />
          ) : (
            // Quem acabou de fazer o primeiro acesso ainda não escolheu avatar
            <div className="w-14 h-14 rounded-2xl bg-branco border-2 border-dashed border-cinza-claro flex items-center justify-center text-xl font-black text-azul/40 shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col gap-0.5 min-w-0 grow">
            <span className="text-xs font-bold uppercase tracking-wider text-azul/55">
              Entrando como
            </span>
            {/* Só o nome é truncado: o número precisa aparecer sempre */}
            <span className="flex min-w-0 text-xl font-extrabold text-azul leading-tight">
              <span className="truncate">{nomeBase}</span>
              {sufixo && <span className="text-coral shrink-0">{sufixo}</span>}
            </span>
          </div>

          <Link
            to="/login_aluno"
            className="flex items-center gap-1.5 bg-branco border border-cinza-claro rounded-xl px-3 min-h-11 shrink-0 text-sm font-bold text-azul hover:border-coral hover:text-coral transition"
          >
            <UserIcon size={16} isAnimated={false} />
            Trocar
          </Link>
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
