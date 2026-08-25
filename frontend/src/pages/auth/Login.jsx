import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { apiRequest } from "../../services/api";

function Login() {
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

      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_type", data.tipo_usuario); // Armazena o tipo de usuário
      }
      if (data?.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      console.log('Resposta do backend:', data);
      // Se for professor, navega para a rota do dashboard/professor
      if (data.tipo_usuario === "professor") {
        navigate("/dashboard"); // ou a rota que você configurou no App.jsx (ex: '/professor')
      } else {
        navigate("/");
      }
    } catch (err) {
      setErro(err.message || "E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center">
      <div className="bg-white pt-4 pb-8 px-8 rounded-2xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LogoKivira className="h-16 md:h-20 w-auto" />
        </div>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            name="email"
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            name="senha"
            type="password"
            placeholder="Senha"
            value={formData.senha}
            onChange={handleChange}
            required
          />
          <Button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-gray-400 cursor-pointer hover:underline">
            Esqueci minha senha
          </p>
          <p className="text-center text-gray-600 text-sm">
            Não tem conta?{" "}
            <Link
              to="/cadastro"
              className="text-azul font-semibold cursor-pointer"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
