import { useState, useRef, useEffect } from "react";

function SelectCustom({ label, name, value, onChange, options, placeholder = "Selecione" }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fecharAoClicarFora = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false);
      }
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, []);

  const opcaoSelecionada = options.find((opcao) => opcao.value === value);

  const selecionar = (novoValor) => {
    onChange({ target: { name, value: novoValor } });
    setAberto(false);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-azul/50">{label}</label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm text-left"
        >
          <span className={opcaoSelecionada ? "text-azul" : "text-azul/40"}>
            {opcaoSelecionada ? opcaoSelecionada.label : placeholder}
          </span>
          <span className={`text-azul/40 text-xs transition-transform ${aberto ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>

        {aberto && (
          <ul className="absolute z-20 top-full mt-0 w-full bg-branco rounded-xl border border-cinza-claro/20 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {options
              .filter((opcao) => opcao.value !== value)
              .map((opcao) => (
                <li key={opcao.value}>
                  <button
                    type="button"
                    onClick={() => selecionar(opcao.value)}
                    className="w-full text-left px-4 py-3.5 text-sm text-azul hover:bg-bege/60 transition-colors"
                  >
                    {opcao.label}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SelectCustom;
