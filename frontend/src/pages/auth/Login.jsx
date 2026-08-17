import {Link} from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { LogoKivira } from "../../components/LogoKivira";

function Login() {
    return (
        <div className="min-h-screen bg-bege flex items-center justify-center">
            <div className="bg-white pt-4 pb-8 px-8 rounded-2xl shadow-md w-full max-w-sm">
                <div className="flex justify-center mb-4">
                    <LogoKivira className="h-16 md:h-20 w-auto" />
                </div>
                
                <form className="flex flex-col gap-4">
                    <Input
                        type="email"
                        placeholder="E-mail"
                    />
                    <Input
                        type="password"
                        placeholder="Senha"
                    />
                    <Button>
                        Entrar
                    </Button>
                    <p className="text-center text-sm text-gray-400">
                        Esqueci minha senha
                    </p>
                    <p className="text-center text-gray-600 text-sm">
                        Não tem conta?{' '}
                        <Link to="/cadastro" className="text-azul font-semibold cursor-pointer">
                            Criar conta
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login    