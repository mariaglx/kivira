import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Input } from "../../components/ui/Input";

const OPCOES_PAPEL = [
  { value: "", label: "Todos os papéis" },
  { value: "admin", label: "Admin" },
  { value: "professor", label: "Professor" },
  { value: "estudante", label: "Aluno" },
];

const BADGE_POR_PAPEL = {
  admin: "bg-azul/10 text-azul",
  professor: "bg-blue-100 text-blue-600",
  estudante: "bg-green-100 text-green-600",
};

function formatarData(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR");
}

export function LogsAuditoria() {
  const navigate = useNavigate();
  const [papel, setPapel] = useState("");
  const [acao, setAcao] = useState("");
  const [entidade, setEntidade] = useState("");
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregarLogs() {
      setCarregando(true);
      setErro("");
      try {
        const parametros = new URLSearchParams();
        if (papel) parametros.set("papel", papel);
        if (acao.trim()) parametros.set("acao", acao.trim());
        if (entidade.trim()) parametros.set("entidade", entidade.trim());
        const query = parametros.toString();
        const resposta = await apiRequest(`/admin/logs-auditoria${query ? `?${query}` : ""}`, {
          signal: controller.signal,
        });
        setLogs(Array.isArray(resposta) ? resposta : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar logs de auditoria:", err.message);
        if (err.message?.includes("permissão") || err.message?.includes("403")) {
          setErro("Você não tem permissão para acessar esta área.");
        } else {
          setErro("Não foi possível carregar os logs de auditoria.");
        }
      } finally {
        setCarregando(false);
      }
    }

    // Espera um pouco antes de refazer a busca por ação/entidade digitadas,
    // pra não disparar uma requisição a cada tecla; o AbortController garante
    // que, se os filtros mudarem de novo enquanto uma busca ainda está em
    // voo, essa resposta atrasada não sobrescreva o resultado do filtro atual.
    const timer = setTimeout(carregarLogs, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [papel, acao, entidade, navigate]);

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Logs de auditoria</h2>
        <p className="text-sm text-azul/50">
          Histórico de ações sensíveis realizadas por admins e professores no sistema.
        </p>
      </header>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-full max-w-[220px]">
          <SelectCustom
            name="papel"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            options={OPCOES_PAPEL}
            placeholder="Filtrar por papel"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
            Ação
          </label>
          <Input
            placeholder="Ex: CRIAR_ATIVIDADE"
            value={acao}
            onChange={(e) => setAcao(e.target.value)}
            className="w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-azul/50">
            Entidade
          </label>
          <Input
            placeholder="Ex: atividade"
            value={entidade}
            onChange={(e) => setEntidade(e.target.value)}
            className="w-56"
          />
        </div>
      </div>

      {erro && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-azul/60">Carregando logs...</p>
      ) : (
        <div className="bg-branco rounded-2xl shadow-sm border border-cinza-claro/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-azul/40 font-bold border-b border-cinza-claro/20">
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Papel</th>
                <th className="px-5 py-3">Ação</th>
                <th className="px-5 py-3">Entidade</th>
                <th className="px-5 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-cinza-claro/10 last:border-0 align-top">
                  <td className="px-5 py-3 text-azul/60 whitespace-nowrap">
                    {formatarData(log.data_criacao)}
                  </td>
                  <td className="px-5 py-3 text-azul/60">
                    {log.usuario_id != null ? `#${log.usuario_id}` : "conta excluída"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge border-none rounded-md px-2.5 py-1 text-[10px] font-bold ${BADGE_POR_PAPEL[log.papel_usuario] || "bg-cinza-claro/20 text-azul/60"}`}>
                      {log.papel_usuario}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-azul">
                    {log.acao}
                  </td>
                  <td className="px-5 py-3 text-azul/60">
                    {log.entidade}
                    {log.entidade_id != null && ` #${log.entidade_id}`}
                  </td>
                  <td className="px-5 py-3 text-azul/50 font-mono text-xs max-w-xs truncate" title={log.detalhes || ""}>
                    {log.detalhes || "—"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-azul/50">
                    Nenhum log encontrado para esse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default LogsAuditoria;
