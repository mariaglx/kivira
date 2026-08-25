import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { LogoKivira } from "../../components/LogoKivira";

function Cadastro() {
    return (
        <div className="min-h-screen bg-bege flex items-center justify-center">
            <div className="bg-white pt-4 pb-8 px-8 rounded-2xl shadow-md w-full max-w-sm">
                <div className="flex justify-center mb-4">
                    <LogoKivira className="h-15 md:h-11 w-auto" />
                </div>
                <p className="text-center text-gray-400 text-sm mb-6">Crie sua conta</p>
                <form className="flex flex-col gap-4">
                    <Input
                        type="text"
                        placeholder="Nome completo"
                    />
                    <Input
                        type="email"
                        placeholder="E-mail"
                    />
                    <Input
                        type="password"
                        placeholder="Senha"
                    />
                    <Input
                        type="password"
                        placeholder="Confirmar senha"
                    />
                    <Button>
                        Criar conta
                    </Button>
                </form>
                <p className="text-center text-gray-600 text-sm mt-4">
                    Já tem conta?{' '}
                    <Link to="/login" className="text-azul font-semibold">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Cadastro