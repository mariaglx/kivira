import { Link } from "react-router-dom";
import { useTurmaForm } from "../../controllers/useTurmaForm";

export function TurmaForm() {
  const { modoEdicao, formData, handleChange, handleSubmit, carregando, salvando, erro } =
    useTurmaForm();

  if (carregando) {
    return (
      <main className="flex-1 p-8">
        <p className="text-azul/60">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link
          to="/professor/turmas"
          className="text-azul/50 hover:text-azul text-sm font-bold"
        >
          ← Turmas
        </Link>
      </header>

      <h2 className="text-2xl font-bold tracking-tight">
        {modoEdicao ? "Editar Turma" : "Nova Turma"}
      </h2>

      {erro && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl max-w-md">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-branco rounded-2xl p-6 shadow-sm border border-cinza-claro/10 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
            Nome da turma
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Ex: 3º Ano B"
            className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Ano escolar
            </label>
            <input
              type="text"
              name="ano_escolar"
              value={formData.ano_escolar}
              onChange={handleChange}
              required
              placeholder="Ex: 3º ano"
              className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
              Ano letivo
            </label>
            <input
              type="number"
              name="ano_letivo"
              value={formData.ano_letivo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
            Descrição
          </label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows={3}
            placeholder="Uma breve descrição da turma (opcional)"
            className="w-full px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm resize-none"
          />
        </div>

        {modoEdicao && (
          <label className="flex items-center gap-2 text-sm font-semibold text-azul cursor-pointer">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className="checkbox checkbox-sm"
            />
            Turma ativa
          </label>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Link
            to="/professor/turmas"
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-azul/60 hover:bg-azul/5 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Criar turma"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default TurmaForm;
