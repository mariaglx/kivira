import { Link } from 'react-router-dom'

function Cadastro() {
    return (
        <div className="min-h-screen bg-laranja-claro flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <h1 className="text-azul text-3xl font-bold text-center mb-2">Kivira</h1>
                <p className="text-center text-gray-400 text-sm mb-6">Crie sua conta de professor</p>
                <form className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Nome completo"
                        className="border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul"
                    />
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
                    <input
                        type="password"
                        placeholder="Confirmar senha"
                        className="border border-cinza-claro rounded-xl p-3 outline-none focus:border-azul"
                    />
                    <button className="bg-coral text-white rounded-xl p-3 font-semibold hover:opacity-90">
                        Criar conta
                    </button>
                </form>
                <p className="text-center text-sm mt-4">
                    Já tem conta?{' '}
                    <Link to="/login" className="text-coral font-semibold">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Cadastro