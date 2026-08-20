import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { LogoKivira } from "../../components/LogoKivira";
import { apiRequest } from "../../services/api";

function Cadastro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpa a mensagem de erro ao digitar
    if (erro) setErro("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    // Validação direta: apenas o que o HTML nativo não resolve
    if (formData.senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setErro("As senhas não coincidem!");
      return;
    }

    setCarregando(true);

    try {
      await apiRequest('/professor/criar_conta', {
        method: "POST",
        data: {
          nome_completo: formData.nome_completo,
          email: formData.email,
          senha: formData.senha,
          apelido: formData.nome_completo.split(" ")[0],
          escola: "",
          biografia: "",
          avatar_url: "",
        },
      });

      navigate("/login");
    } catch (err) {
      setErro(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-bege flex items-center justify-center">
      <div className="bg-white pt-4 pb-8 px-8 rounded-2xl shadow-md w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LogoKivira className="h-15 md:h-11 w-auto" />
        </div>
        <p className="text-center text-gray-400 text-sm mb-6">Crie sua conta</p>

        {erro && (
          <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="nome_completo"
            type="text"
            placeholder="Nome completo"
            value={formData.nome_completo}
            onChange={handleChange}
            required
          />
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
          <Input
            name="confirmarSenha"
            type="password"
            placeholder="Confirmar senha"
            value={formData.confirmarSenha}
            onChange={handleChange}
            required
          />
          <Button type="submit" disabled={carregando}>
            {carregando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Já tem conta?{" "}
          <Link to="/login" className="text-azul font-semibold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Cadastro;
