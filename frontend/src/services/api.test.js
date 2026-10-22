import { beforeEach, expect, test, vi } from "vitest";

// localStorage e fetch falsos: o teste roda no Node, sem navegador nem backend.
let chamadas;
beforeEach(() => {
  chamadas = 0;
  vi.stubGlobal("localStorage", { getItem: () => null, setItem() {}, removeItem() {} });
  vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ chamada: ++chamadas }) }));
  vi.resetModules(); // cada teste começa com o cache vazio
});

const carregarApi = async () => (await import("./api.js")).apiRequest;

test("GET repetido vem do cache", async () => {
  const apiRequest = await carregarApi();
  await apiRequest("/turma/");
  expect(await apiRequest("/turma/")).toEqual({ chamada: 1 });
  expect(chamadas).toBe(1);
});

test("POST limpa o cache", async () => {
  const apiRequest = await carregarApi();
  await apiRequest("/turma/");
  await apiRequest("/turma/criar", { method: "POST", data: {} });
  expect(await apiRequest("/turma/")).toEqual({ chamada: 3 });
});

test("cache expira depois de 5 minutos", async () => {
  vi.useFakeTimers();
  const apiRequest = await carregarApi();
  await apiRequest("/turma/");
  vi.advanceTimersByTime(5 * 60 * 1000 + 1);
  expect(await apiRequest("/turma/")).toEqual({ chamada: 2 });
  vi.useRealTimers();
});

test("resposta com erro não vai pro cache", async () => {
  vi.stubGlobal("fetch", async () => ({ ok: false, status: 500, json: async () => ({ detail: "falhou" }) }));
  const apiRequest = await carregarApi();
  await expect(apiRequest("/turma/")).rejects.toThrow("falhou");
  vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ ok: true }) }));
  expect(await apiRequest("/turma/")).toEqual({ ok: true });
});
