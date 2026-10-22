import { describe, expect, it } from "vitest";
import { nivelPorXp, progressoNivel } from "./xp";

describe("curva de nível", () => {
  it("cada nível custa mais que o anterior", () => {
    expect([0, 99, 100, 299, 300, 600, 1000].map(nivelPorXp)).toEqual([1, 1, 2, 2, 3, 4, 5]);
  });

  it("progresso é relativo ao nível atual", () => {
    expect(progressoNivel(350)).toEqual({ nivel: 3, xpNoNivel: 50, xpDoNivel: 300 });
  });
});
