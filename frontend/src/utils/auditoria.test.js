import { describe, expect, it } from "vitest";
import { categoriaDaAcao, descreverAparelho, descreverLog } from "./auditoria";

describe("auditoria", () => {
  it("descreve login, senha errada e login inexistente", () => {
    const ana = { nome: "Ana Souza", identificador: "ana.souza" };
    expect(descreverLog({ acao: "LOGIN", usuario: ana })).toEqual({ quem: "Ana Souza", oque: "entrou no sistema" });
    expect(descreverLog({ acao: "LOGIN_FALHOU", usuario: ana, detalhes: { motivo: "senha_incorreta" } }).oque).toBe(
      "errou a senha ao tentar entrar",
    );
    expect(
      descreverLog({ acao: "LOGIN_FALHOU", usuario: null, detalhes: { motivo: "usuario_inexistente", identificador: "x@y.com" } }),
    ).toEqual({ quem: "x@y.com", oque: "tentou entrar, mas esse login não existe" });
  });

  it("usa o título guardado no log", () => {
    expect(descreverLog({ acao: "CRIAR_ATIVIDADE", usuario: { nome: "Maria" }, detalhes: { titulo: "Frações" } }).oque).toBe(
      'criou a atividade "Frações"',
    );
  });

  it("reconhece o aparelho", () => {
    expect(descreverAparelho("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Version/17.0 Mobile Safari/604.1")).toBe("iPhone · Safari");
    expect(descreverAparelho("Mozilla/5.0 (Windows NT 10.0) AppleWebKit Chrome/120.0 Safari/537.36")).toBe("Windows · Chrome");
    expect(descreverAparelho(null)).toBeNull();
  });

  it("separa falha de login das outras ações de acesso", () => {
    expect(categoriaDaAcao("LOGIN_FALHOU")).toBe("falhas");
    expect(categoriaDaAcao("LOGIN")).toBe("acessos");
    expect(categoriaDaAcao("ALGO_NOVO")).toBe("outros");
  });
});
