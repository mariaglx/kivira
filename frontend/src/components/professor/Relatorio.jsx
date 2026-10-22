// Peças compartilhadas pelas telas de relatório do professor (atividade e aluno).

const STATUS = {
  concluido: { texto: "Concluiu", estilo: "bg-green-100 text-green-600" },
  em_andamento: { texto: "Jogando", estilo: "bg-amber-100 text-amber-600" },
  abandonado: { texto: "Não terminou", estilo: "bg-red-100 text-red-500" },
  nao_iniciado: { texto: "Não começou", estilo: "bg-cinza-claro text-azul/60" },
};

export function SeloStatus({ status }) {
  return (
    <span className={`badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${STATUS[status].estilo}`}>
      {STATUS[status].texto}
    </span>
  );
}

export function Indicador({ rotulo, valor }) {
  return (
    <div className="cartao rounded-2xl p-4 flex flex-col gap-1">
      <span className="rotulo">{rotulo}</span>
      <span className="text-2xl font-extrabold text-azul">{valor}</span>
    </div>
  );
}
