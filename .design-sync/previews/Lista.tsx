import { Lista, Item } from "kivira";

const turmas = [
  { nome: "3º ano A", alunos: 24 },
  { nome: "4º ano B", alunos: 21 },
  { nome: "5º ano A", alunos: 27 },
];

export const GradeDeCards = () => (
  <div className="p-4 bg-bege">
    <Lista className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {turmas.map((t) => (
        <Item key={t.nome} elevar className="cartao p-4">
          <p className="font-bold text-azul">{t.nome}</p>
          <p className="text-xs text-azul/60">{t.alunos} alunos</p>
        </Item>
      ))}
    </Lista>
  </div>
);
