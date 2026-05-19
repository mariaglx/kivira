import {Link} from 'react-router-dom'

function Login() {
    return (
        <div className="min-h-screen bg-laranja-claro flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h1 className="text-azul text-3xl font-bold text-center mb-6">Kivira</h1>
                <form className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="E-mail"
                        className="border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        className="border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul"
                    />
                    <button className="bg-coral text-white rounded-xl p-3 font-semibold hover:opacity-90">
                        Entrar
                    </button>
                    <p className="text-center text-sm text-gray-400">
                        Esqueci minha senha
                    </p>
                    <p className="text-center text-sm">
                        Não tem conta?{' '}
                        <Link to="/cadastro" className="text-coral font-semibold cursor-pointer">
                            Criar conta
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login    