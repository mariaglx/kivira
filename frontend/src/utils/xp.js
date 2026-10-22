// Curva de nível do aluno: subir do nível N pro N+1 custa 100 × N de XP
// (nível 2 aos 100, 3 aos 300, 4 aos 600, 5 aos 1000...). Espelha
// backend/services/sessao_jogo_service.py — as duas precisam ficar em sincronia.
export const xpParaNivel = (nivel) => 50 * nivel * (nivel - 1);

export function nivelPorXp(xpTotal = 0) {
  let nivel = 1;
  while (xpParaNivel(nivel + 1) <= (xpTotal ?? 0)) nivel += 1;
  return nivel;
}

// Tudo que a barra de XP precisa: o nível, quanto já tem dentro dele e quanto
// o nível inteiro custa.
export function progressoNivel(xpTotal = 0) {
  const nivel = nivelPorXp(xpTotal);
  const inicio = xpParaNivel(nivel);
  return { nivel, xpNoNivel: (xpTotal ?? 0) - inicio, xpDoNivel: xpParaNivel(nivel + 1) - inicio };
}
