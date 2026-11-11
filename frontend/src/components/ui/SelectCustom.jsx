import { useId } from "react";

// Select padrão do app: <select> nativo com a classe `select` do daisyUI nas
// cores do Kivira. Nativo de propósito: teclado (setas, letra inicial, Esc),
// leitor de tela e a roda de opções do celular vêm de graça.
// `placeholder` vira a opção vazia ("") quando `options` não traz uma; sem
// `label` visível, ele também serve de nome acessível (filtros do admin).
export function SelectCustom({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}) {
  const id = useId();
  // Sem `placeholder` o campo é obrigatório: a opção vazia só aparece enquanto
  // nada foi escolhido, pra não dar pra "desescolher" (ex: dificuldade)
  const mostrarVazia =
    !options.some((opcao) => opcao.value === "") && (placeholder !== undefined || !value);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="rotulo">
          {label}
        </label>
      )}

      <select
        id={id}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        aria-label={label ? undefined : placeholder}
        // appearance-none: o daisyUI liga o `base-select` do Chrome novo, onde
        // texto longo passava por baixo da setinha em vez de ser cortado
        className={`select appearance-none w-full rounded-xl border-cinza-claro bg-branco text-sm shadow-sm ${
          value ? "text-azul" : "text-azul/75"
        }`}
      >
        {mostrarVazia && <option value="">{placeholder ?? "Selecione"}</option>}
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value} className="text-azul">
            {opcao.label}
          </option>
        ))}
      </select>
    </div>
  );
}
