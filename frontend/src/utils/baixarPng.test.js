import { describe, expect, it } from "vitest";
import { linhasDaLegenda, nomeArquivo } from "./baixarPng";

describe("nomeArquivo", () => {
  it("tira acento e espaço", () => {
    expect(nomeArquivo("Professores — Distribuição das respostas")).toBe("professores-distribuicao-das-respostas");
  });
});

describe("linhasDaLegenda", () => {
  // Cada letra mede 10px: "Sim" = 30px, item inteiro = 12 + 6 + 30 = 48px
  const medir = (texto) => texto.length * 10;
  const itens = ["Sim", "Não", "Bom"].map((rotulo) => ({ rotulo, cor: "#000" }));

  it("põe tudo numa linha quando cabe", () => {
    const linhas = linhasDaLegenda(itens, 500, medir);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].map((i) => i.x)).toEqual([0, 68, 136]);
  });

  it("quebra quando não cabe e recomeça do zero", () => {
    const linhas = linhasDaLegenda(itens, 120, medir);
    expect(linhas.map((l) => l.map((i) => i.rotulo))).toEqual([["Sim", "Não"], ["Bom"]]);
    expect(linhas[1][0].x).toBe(0);
  });
});
