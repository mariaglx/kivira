// Peças compartilhadas pelas telas de relatório do professor (atividade e aluno).

const STATUS = {
  concluido: { texto: "Concluiu", estilo: "bg-verde/10 text-verde-texto" },
  em_andamento: { texto: "Jogando", estilo: "bg-ouro-bg text-ouro-fg" },
  abandonado: { texto: "Não terminou", estilo: "bg-vermelho/10 text-vermelho" },
  nao_iniciado: { texto: "Não começou", estilo: "bg-cinza-claro text-azul/80" },
};

export function SeloStatus({ status }) {
  return (
    <span className={`badge border-none rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap ${STATUS[status].estilo}`}>
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
