import { describe, expect, it } from "vitest";
import { subtituloTurma } from "./turma";

describe("subtituloTurma", () => {
  it("não repete o ano escolar que já está no nome", () => {
    expect(subtituloTurma({ nome: "3º Ano A", ano_escolar: "3º ano", ano_letivo: 2026 })).toBe("2026");
  });

  it("mostra o ano escolar quando o nome não diz", () => {
    expect(subtituloTurma({ nome: "Reforço de Matemática", ano_escolar: "3º ano", ano_letivo: 2026 })).toBe("3º ano · 2026");
  });
});
