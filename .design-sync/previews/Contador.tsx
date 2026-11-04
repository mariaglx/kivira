import { Contador } from "kivira";

export const EmEstatistica = () => (
  <div className="p-4 bg-bege grid grid-cols-3 gap-3 max-w-md">
    {[
      { rotulo: "Alunos", valor: 72 },
      { rotulo: "Atividades", valor: 15 },
      { rotulo: "Acertos", valor: 348 },
    ].map((s) => (
      <div key={s.rotulo} className="cartao p-4 text-center">
        <p className="text-3xl font-black text-coral">
          <Contador valor={s.valor} />
        </p>
        <p className="rotulo mt-1">{s.rotulo}</p>
      </div>
    ))}
  </div>
);
