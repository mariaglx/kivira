import { Link } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";

function LoginAluno() {
//   const location = useLocation();
//   const sessionCode = location.state?.sessionCode || "";
  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-10 rounded-3xl shadow-lg w-full max-w-md md:max-w-lg">
        {/* Logo e Título */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <LogoKivira className="h-16 md:h-20 w-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-700">
            Primeiro Acesso
          </h2>
        </div>

        <form className="flex flex-col gap-5">
          {/* Campo Usuário */}
          <div className="flex flex-col gap-1.5">
            <label className="text-start text-gray-600 text-base font-medium">
              Insira seu nome de usuário
            </label>
            <Input
              type="text"
              placeholder="Ex: Joao.Silva"
              className="text-base py-3 px-4"
            />
          </div>

          {/* Campo Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-start text-gray-600 text-base font-medium">
              Insira sua senha padrão (fornecida pelo professor)
            </label>
            <Input
              type="password"
              placeholder="Senha"
              className="text-base py-3 px-4"
            />
          </div>

          {/* Botão Entrar
          <div className="mt-2">
            <Button>Entrar</Button>
          </div> */}
          <Button>Entrar</Button>

          {/* Links auxiliares */}
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-center text-base text-gray-400 hover:text-gray-600 cursor-pointer">
              Esqueci minha senha
            </p>
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
