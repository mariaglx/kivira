import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COR } from "../../utils/feedback";

const ALTURA_LINHA = 44;

// Barras horizontais 100% empilhadas, uma por linha.
// `linhas`: [{ rotulo, valores: [n1, n2...], nomes?: [...] }] — `nomes` troca,
// só no tooltip daquela linha, o nome de cada pedaço (ex: "Fácil" em vez de "4").
// `nomes`/`cores`: um por pedaço, na ordem de `valores`.
export function BarrasEmpilhadas({ linhas, nomes, cores, larguraRotulo = 180 }) {
  const dados = linhas.map((linha) => ({
    ...linha,
    total: linha.valores.reduce((soma, v) => soma + v, 0),
    ...Object.fromEntries(linha.valores.map((v, i) => [`v${i}`, v])),
  }));

  function formatar(valor, chave, { payload }) {
    const i = Number(chave.slice(1));
    const porcento = payload.total ? Math.round((100 * valor) / payload.total) : 0;
    return [`${valor} (${porcento}%)`, payload.nomes?.[i] ?? nomes[i]];
  }

  return (
    <ResponsiveContainer width="100%" height={linhas.length * ALTURA_LINHA + 30}>
      <BarChart data={dados} layout="vertical" stackOffset="expand" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          type="number"
          tickFormatter={(v) => `${Math.round(v * 100)}%`}
          tick={{ fill: COR.azul, fontSize: 11 }}
          stroke={COR.neutro}
        />
        <YAxis
          type="category"
          dataKey="rotulo"
          width={larguraRotulo}
          tick={{ fill: COR.azul, fontSize: 12, fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={formatar}
          cursor={{ fill: COR.neutro, fillOpacity: 0.3 }}
          contentStyle={{ borderRadius: 12, border: `1px solid ${COR.neutro}`, fontSize: 12 }}
          labelStyle={{ color: COR.azul, fontWeight: 700 }}
        />
        {cores.map((cor, i) => (
          // name = chave: o formatar acha o índice do pedaço por ela
          <Bar key={i} dataKey={`v${i}`} name={`v${i}`} stackId="a" fill={cor} barSize={26} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
