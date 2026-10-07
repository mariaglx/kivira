import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { apiRequest } from "../../services/api";
import { salvarSessao } from "../../services/sessao";

export function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erro) setErro("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const data = await apiRequest("/auth_kivira/login", {
        method: "POST",
        data: {
          email: formData.email,
          senha: formData.senha,
        },
      });

      salvarSessao({ accessToken: data?.access_token, refreshToken: data?.refresh_token, tipo: data?.tipo_usuario });

      if (data.tipo_usuario === "admin") {
        navigate("/admin");
      } else if (data.tipo_usuario === "professor") {
        navigate("/professor");
      } else {
        navigate("/");
      }
    } catch (err) {
      setErro(err.message || "E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  // Mesmo formato das telas de acesso do aluno (LoginAluno/PrimeiroAcesso):
  // card arredondado com respiro lateral no celular, logo com bounceIn e
  // campos com rótulo em cima
  return (
    <div className="min-h-screen bg-bege flex items-center justify-center p-4">
      <div className="bg-white py-10 px-6 sm:px-10 rounded-3xl shadow-lg w-full max-w-md md:max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-6">
          <LogoKivira className="h-16 md:h-20 w-auto animate__animated animate__bounceIn" />
          <h2 className="text-xl md:text-2xl font-bold text-azul">Área do professor</h2>
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-start text-gray-600 text-base font-medium">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              className="text-base py-3 px-4"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-start text-gray-600 text-base font-medium">
              Senha
            </label>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="Sua senha"
              value={formData.senha}
              onChange={handleChange}
              className="text-base py-3 px-4"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <div className="flex flex-col gap-2 mt-2 text-center text-base">
            <p className="text-sm text-gray-400 cursor-pointer hover:underline">
              Esqueci minha senha
            </p>
            <p className="text-gray-600">
              Não tem conta?{" "}
              <Link to="/cadastro" className="text-azul font-bold hover:underline">
                Criar conta
              </Link>
            </p>
            <p className="text-gray-600">
              É aluno?{" "}
              <Link to="/login_aluno" className="text-coral font-bold hover:underline">
                Entrar por aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
