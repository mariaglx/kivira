// Compila .design-sync/kivira.css com o Tailwind do frontend -> .design-sync/.cache/kivira.css
// (cfg.cssEntry). Rodar da raiz: node .design-sync/build-css.mjs
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const req = createRequire(resolve("frontend/package.json"));
const carregar = (pkg) => import(pathToFileURL(req.resolve(pkg)).href);
const { compile, optimize } = await carregar("@tailwindcss/node");
const { Scanner } = await carregar("@tailwindcss/oxide");

const entrada = resolve(".design-sync/kivira.css");
const compilador = await compile(readFileSync(entrada, "utf8"), { base: dirname(entrada), onDependency() {} });
const candidatos = new Scanner({ sources: compilador.sources }).scan();

// Fontes do index.html do app (Inter via rsms, Nunito via Google Fonts).
const fontes =
  '@import url("https://rsms.me/inter/inter.css");\n' +
  '@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap");\n';
mkdirSync(".design-sync/.cache", { recursive: true });
writeFileSync(".design-sync/.cache/kivira.css", fontes + optimize(compilador.build(candidatos)).code);
console.log(`kivira.css: ${candidatos.length} candidatos`);
