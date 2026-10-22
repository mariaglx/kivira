import { useState } from "react";
import {
  AlertTriangle, BookOpen, ChevronDown, Gamepad2, KeyRound, LogIn, LogOut,
  RefreshCw, Search, ShieldAlert, UserCog, Users,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { Input } from "../../components/ui/Input";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Indicador } from "../../components/professor/Relatorio";
import { useLogsAuditoria } from "../../controllers/useLogsAuditoria";
import { OPCOES_PAPEL, BADGE_POR_PAPEL, LABEL_POR_PAPEL } from "../../utils/papeis";
import {
  CATEGORIAS, TELA_DE_LOGIN, categoriaDaAcao, descreverAparelho, descreverLog, detalhesExtras,
} from "../../utils/auditoria";

const ESTILO_CATEGORIA = {
  acessos: { Icone: LogIn, cor: "bg-green-100 text-green-600" },
  falhas: { Icone: ShieldAlert, cor: "bg-red-100 text-red-500" },
  turmas: { Icone: Users, cor: "bg-blue-100 text-blue-600" },
  atividades: { Icone: BookOpen, cor: "bg-amber-100 text-amber-600" },
  jogo: { Icone: Gamepad2, cor: "bg-coral/15 text-coral" },
  contas: { Icone: UserCog, cor: "bg-azul/10 text-azul" },
  outros: { Icone: KeyRound, cor: "bg-cinza-claro text-azul/60" },
};

function quandoFoi(dataIso) {
  const data = new Date(dataIso);
  const minutos = Math.round((Date.now() - data) / 60000);
  const relativo =
    minutos < 1 ? "agora" : minutos < 60 ? `há ${minutos} min` : minutos < 1440 ? `há ${Math.round(minutos / 60)} h` : null;
  const completo = data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return { relativo, completo };
}

function LinhaLog({ log }) {
  const [aberto, setAberto] = useState(false);
  const categoria = categoriaDaAcao(log.acao);
  const { Icone, cor } = ESTILO_CATEGORIA[categoria];
  const IconeFinal = log.acao === "LOGOUT" ? LogOut : Icone;
  const { quem, oque } = descreverLog(log);
  const { relativo, completo } = quandoFoi(log.data_criacao);
  const d = log.detalhes ?? {};
  const aparelho = descreverAparelho(d.navegador);
  const extras = detalhesExtras(d);
  const identificador = log.usuario?.identificador;

  return (
    <li className={`p-4 flex gap-3 sm:gap-4 ${log.acao === "LOGIN_FALHOU" ? "bg-red-50/60" : ""}`}>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cor}`}>
        <IconeFinal size={18} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4">
          <p className="text-sm text-azul break-words">
            <span className="font-bold">{quem}</span> {oque}
          </p>
          <span className="text-xs text-azul/50 whitespace-nowrap" title={completo}>
            {relativo ? `${relativo} · ` : ""}{completo}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-azul/60">
          {log.usuario ? (
            <span className={`badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold ${BADGE_POR_PAPEL[log.papel_usuario] || "bg-cinza-claro text-azul/60"}`}>
              {LABEL_POR_PAPEL[log.papel_usuario] || log.papel_usuario}
            </span>
          ) : (
            <span className="badge border-none rounded-md px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-500">Sem conta</span>
          )}
          {identificador && identificador !== quem && <span>{identificador}</span>}
          {log.usuario?.turmas?.length > 0 && <span>· {log.usuario.turmas.join(", ")}</span>}
          {d.via && <span>· pela {TELA_DE_LOGIN[d.via] ?? d.via}</span>}
        </div>

        {(d.ip || aparelho) && (
          <p className="text-xs text-azul/50">
            {[d.ip && `IP ${d.ip}`, aparelho].filter(Boolean).join(" · ")}
          </p>
        )}

        {extras.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              className="text-xs font-bold text-coral flex items-center gap-1"
              aria-expanded={aberto}
            >
              Detalhes <ChevronDown size={14} className={`transition-transform ${aberto ? "rotate-180" : ""}`} />
            </button>
            {aberto && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs bg-bege/40 rounded-xl p-3">
                {extras.map(([chave, valor]) => (
                  <div key={chave} className="contents">
                    <dt className="font-bold text-azul/50">{chave.replaceAll("_", " ")}</dt>
                    <dd className="text-azul break-all">{typeof valor === "object" ? JSON.stringify(valor) : String(valor)}</dd>
                  </div>
                ))}
                <dt className="font-bold text-azul/50">registro</dt>
                <dd className="text-azul">#{log.id} · {log.entidade}{log.entidade_id != null && ` #${log.entidade_id}`}</dd>
              </dl>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function LogsAuditoria() {
  const {
    filtros, alterarFiltro, limparFiltros, atualizar,
    logs, total, resumo, carregando, carregandoMais, carregarMais, erro,
  } = useLogsAuditoria();

  const temFiltro = Object.values(filtros).some(Boolean);

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-sm font-bold text-azul uppercase tracking-wider opacity-70">Auditoria</h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-azul mt-1">Quem fez o quê</h2>
          <p className="text-azul/70 text-sm mt-1">
            Cada entrada no sistema, tentativa que falhou e alteração — com quem, quando, IP e aparelho.
          </p>
        </div>
        <Button tamanho="sm" variante="contorno" onClick={atualizar} className="flex items-center gap-2">
          <RefreshCw size={14} /> Atualizar
        </Button>
      </header>

      {resumo && (
        <section className="flex flex-col gap-3">
          <p className="rotulo">Últimas 24 horas</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Indicador rotulo="Acessos" valor={resumo.acessos} />
            <Indicador rotulo="Pessoas que entraram" valor={resumo.pessoas} />
            <Indicador rotulo="Crianças que entraram" valor={resumo.alunos} />
            <Indicador rotulo="Tentativas falhas" valor={resumo.falhas} />
          </div>
          {resumo.suspeitos.map((s) => (
            <div key={s.identificador} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="flex-1 min-w-0">
                <span className="font-bold">{s.identificador}</span> teve {s.tentativas} tentativas de login que falharam.
                Pode ser alguém tentando adivinhar a senha.
              </p>
              <Button
                tamanho="sm"
                variante="perigo"
                onClick={() => {
                  alterarFiltro("categoria", "falhas");
                  alterarFiltro("busca", s.identificador);
                }}
              >
                Ver tentativas
              </Button>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <nav className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" aria-label="Tipo de registro">
          {CATEGORIAS.map((c) => (
            <button
              key={c.chave}
              type="button"
              onClick={() => alterarFiltro("categoria", c.chave)}
              aria-pressed={filtros.categoria === c.chave}
              className={`px-4 min-h-11 rounded-full text-sm font-bold whitespace-nowrap transition ${
                filtros.categoria === c.chave
                  ? "bg-coral text-branco shadow-sm"
                  : "bg-branco text-azul/70 hover:text-azul border border-cinza-claro"
              }`}
            >
              {c.rotulo}
            </button>
          ))}
        </nav>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Input
            icone={Search}
            placeholder="Nome, login, e-mail ou IP"
            value={filtros.busca}
            onChange={(e) => alterarFiltro("busca", e.target.value)}
            className="py-2.5 text-sm bg-branco shadow-sm"
          />
          <SelectCustom
            name="papel"
            value={filtros.papel}
            onChange={(e) => alterarFiltro("papel", e.target.value)}
            options={OPCOES_PAPEL}
            placeholder="Todos os papéis"
          />
          <label className="flex flex-col gap-1.5">
            <span className="rotulo">De</span>
            <Input type="date" value={filtros.desde} onChange={(e) => alterarFiltro("desde", e.target.value)} className="py-2 text-sm bg-branco" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="rotulo">Até</span>
            <Input type="date" value={filtros.ate} onChange={(e) => alterarFiltro("ate", e.target.value)} className="py-2 text-sm bg-branco" />
          </label>
        </div>
        {temFiltro && (
          <button type="button" onClick={limparFiltros} className="text-xs font-bold text-coral w-fit">
            Limpar filtros
          </button>
        )}
      </section>

      {erro && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">{erro}</div>
      )}

      {carregando ? (
        <Carregando embutido texto="Carregando registros..." />
      ) : logs.length === 0 ? (
        <EstadoVazio>Nenhum registro encontrado com esses filtros.</EstadoVazio>
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-xs text-azul/50">Mostrando {logs.length} de {total} registros</p>
          <ul className="cartao rounded-2xl divide-y divide-cinza-claro overflow-hidden">
            {logs.map((log) => (
              <LinhaLog key={log.id} log={log} />
            ))}
          </ul>
          {logs.length < total && (
            <Button variante="contorno" onClick={carregarMais} disabled={carregandoMais} className="self-center">
              {carregandoMais ? "Carregando..." : "Carregar mais"}
            </Button>
          )}
        </section>
      )}
    </main>
  );
}

export default LogsAuditoria;
