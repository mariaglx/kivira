// Subtítulo de uma turma: "3º ano · 2026". O ano escolar só entra se o nome já
// não disser ele (turma "3º ano A" do 3º ano viraria "3º ano A / 3º ano").
export function subtituloTurma({ nome = "", ano_escolar: anoEscolar, ano_letivo: anoLetivo }) {
  const repetido = anoEscolar && nome.toLowerCase().includes(anoEscolar.toLowerCase());
  return [repetido ? null : anoEscolar, anoLetivo].filter(Boolean).join(" · ");
}
