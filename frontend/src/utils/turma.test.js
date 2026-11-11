import { describe, expect, it } from "vitest";
import {
  lerArquivoDeAlunos,
  linhasDeHtmlDocx,
  montarAlunos,
  parseAlunosColados,
  subtituloTurma,
} from "./turma";

describe("parseAlunosColados", () => {
  it("lê uma coluna só como nome completo, quebrando no primeiro espaço", () => {
    expect(parseAlunosColados("João Silva\nMaria Clara Souza")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "" },
      { nome: "Maria", sobrenome: "Clara Souza", matricula: "" },
    ]);
  });

  it("mapeia colunas do Excel (TAB) em nome, sobrenome e matrícula", () => {
    expect(parseAlunosColados("João\tSilva\t1023\nAna\tLima\t1024")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "1023" },
      { nome: "Ana", sobrenome: "Lima", matricula: "1024" },
    ]);
  });

  it("aceita ';' do CSV brasileiro e coluna de matrícula ausente", () => {
    expect(parseAlunosColados("João;Silva")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "" },
    ]);
  });

  it("ignora linhas em branco, espaços sobrando e quebra do Windows", () => {
    expect(parseAlunosColados("  João Silva  \r\n\r\n   \r\nAna Lima\r\n")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "" },
      { nome: "Ana", sobrenome: "Lima", matricula: "" },
    ]);
  });

  it("aguenta nome sem sobrenome", () => {
    expect(parseAlunosColados("Madonna")).toEqual([
      { nome: "Madonna", sobrenome: "", matricula: "" },
    ]);
  });

  it("não trata vírgula como coluna numa cola de texto", () => {
    expect(parseAlunosColados("Souza, Maria")).toEqual([
      { nome: "Souza,", sobrenome: "Maria", matricula: "" },
    ]);
  });

  it("trata vírgula como coluna quando veio de .csv", () => {
    expect(parseAlunosColados("João,Silva,1023", { aceitarVirgula: true })).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "1023" },
    ]);
  });

  it("descarta a linha de cabeçalho da planilha", () => {
    expect(parseAlunosColados("Nome\tSobrenome\tMatrícula\nJoão\tSilva\t1023")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "1023" },
    ]);
    expect(parseAlunosColados("NOME COMPLETO\nJoão Silva")).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "" },
    ]);
  });

  it("não confunde aluno de verdade com cabeçalho", () => {
    expect(parseAlunosColados("Nome Sobrenome da Silva")).toEqual([
      { nome: "Nome", sobrenome: "Sobrenome da Silva", matricula: "" },
    ]);
  });
});

describe("lerArquivoDeAlunos", () => {
  // Monta um File de mentira a partir de bytes crus — é o que o input/drop
  // entrega, e é por isso que o encoding importa
  const arquivo = (nome, bytes) => ({
    name: nome,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  });

  const utf8 = (texto) => [...new TextEncoder().encode(texto)];

  it("lê um .csv separado por ';' em UTF-8", async () => {
    await expect(lerArquivoDeAlunos(arquivo("turma.csv", utf8("João;Silva;1023")))).resolves.toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "1023" },
    ]);
  });

  it("lê acento de arquivo salvo em Windows-1252 pelo Excel", async () => {
    // "João Silva" em cp1252: o "ã" é o byte 0xE3 sozinho, inválido em UTF-8
    const bytes = [0x4a, 0x6f, 0xe3, 0x6f, 0x20, 0x53, 0x69, 0x6c, 0x76, 0x61];
    await expect(lerArquivoDeAlunos(arquivo("turma.csv", bytes))).resolves.toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "" },
    ]);
  });

  it("tira o BOM que o Excel põe na frente do arquivo", async () => {
    await expect(lerArquivoDeAlunos(arquivo("turma.csv", utf8("﻿Ana Lima")))).resolves.toEqual([
      { nome: "Ana", sobrenome: "Lima", matricula: "" },
    ]);
  });

  it("recusa formato que não sabe ler", async () => {
    await expect(lerArquivoDeAlunos(arquivo("turma.pdf", utf8("qualquer coisa")))).rejects.toThrow(
      /turma\.pdf/,
    );
  });

  it("recusa arquivo vazio", async () => {
    await expect(lerArquivoDeAlunos(arquivo("turma.csv", utf8("  \n\n")))).rejects.toThrow(/vazio/);
  });
});

describe("montarAlunos", () => {
  it("aceita célula numérica e vazia da planilha", () => {
    // read-excel-file devolve número e null crus, não string
    expect(montarAlunos([["João", "Silva", 1023], ["Ana", "Lima", null]])).toEqual([
      { nome: "João", sobrenome: "Silva", matricula: "1023" },
      { nome: "Ana", sobrenome: "Lima", matricula: "" },
    ]);
  });

  it("descarta linha totalmente vazia da planilha", () => {
    expect(montarAlunos([["", "", ""], ["Ana", "Lima", ""], [null]])).toEqual([
      { nome: "Ana", sobrenome: "Lima", matricula: "" },
    ]);
  });
});

describe("linhasDeHtmlDocx", () => {
  it("lê a tabela do Word, uma célula por coluna", () => {
    const html =
      "<table><tr><td>Nome</td><td>Sobrenome</td></tr>" +
      "<tr><td>João</td><td>Gonçalves</td></tr>" +
      "<tr><td><strong>Ana</strong></td><td>Lima</td></tr></table>";
    expect(linhasDeHtmlDocx(html)).toEqual([
      ["Nome", "Sobrenome"],
      ["João", "Gonçalves"],
      ["Ana", "Lima"],
    ]);
  });

  it("cai pros parágrafos quando não há tabela", () => {
    expect(linhasDeHtmlDocx("<p>João Silva</p><p></p><li>Ana Lima</li>")).toEqual([
      ["João Silva"],
      [""],
      ["Ana Lima"],
    ]);
  });

  it("desfaz as entidades do mammoth", () => {
    expect(linhasDeHtmlDocx("<p>Ana&nbsp;Lima &amp; Cia</p>")).toEqual([["Ana Lima & Cia"]]);
  });

  it("junta com montarAlunos tirando o cabeçalho e as linhas vazias", () => {
    const html = "<table><tr><td>Nome</td><td>Sobrenome</td></tr><tr><td>Ana</td><td>Lima</td></tr></table>";
    expect(montarAlunos(linhasDeHtmlDocx(html))).toEqual([
      { nome: "Ana", sobrenome: "Lima", matricula: "" },
    ]);
  });
});

describe("subtituloTurma", () => {
  it("não repete o ano escolar que já está no nome", () => {
    expect(subtituloTurma({ nome: "3º Ano A", ano_escolar: "3º ano", ano_letivo: 2026 })).toBe("2026");
  });

  it("mostra o ano escolar quando o nome não diz", () => {
    expect(subtituloTurma({ nome: "Reforço de Matemática", ano_escolar: "3º ano", ano_letivo: 2026 })).toBe("3º ano · 2026");
  });
});
