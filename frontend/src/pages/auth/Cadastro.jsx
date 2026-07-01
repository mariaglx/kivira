import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

function Cadastro() {
    return (
        <div className="min-h-screen bg-bege flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h1 className="text-coral text-3xl font-bold text-center mb-2 tracking-widest">KIVIRA</h1>
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