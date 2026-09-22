// Regra de nível do aluno: a cada XP_POR_NIVEL pontos, sobe um nível.
// (o backend só guarda xp_total e nivel_atual — a regra é definida aqui no front)
export const XP_POR_NIVEL = 100;

export const xpNoNivel = (xpTotal = 0) => xpTotal % XP_POR_NIVEL;
