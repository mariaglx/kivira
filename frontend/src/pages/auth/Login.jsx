import {Link} from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

function Login() {
    return (
        <div className="min-h-screen bg-bege flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h1 className="text-coral text-3xl font-bold text-center mb-6 tracking-widest">KIVIRA</h1>
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