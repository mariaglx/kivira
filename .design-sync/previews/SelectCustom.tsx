import { useState } from "react";
import { SelectCustom } from "kivira";

const turmas = [
  { value: "3a", label: "3º ano A" },
  { value: "4b", label: "4º ano B" },
  { value: "5a", label: "5º ano A" },
];

export const ComRotulo = () => {
  const [turma, setTurma] = useState("4b");
  return (
    <div className="p-4 max-w-xs">
      <SelectCustom label="Turma" name="turma" value={turma} onChange={(e) => setTurma(e.target.value)} options={turmas} />
    </div>
  );
};

export const SemSelecao = () => {
  const [disciplina, setDisciplina] = useState("");
  return (
    <div className="p-4 max-w-xs">
      <SelectCustom
        label="Disciplina"
        name="disciplina"
        value={disciplina}
        onChange={(e) => setDisciplina(e.target.value)}
        placeholder="Escolha a disciplina"
        options={[
          { value: "mat", label: "Matemática" },
          { value: "por", label: "Português" },
          { value: "cie", label: "Ciências" },
        ]}
      />
    </div>
  );
};
