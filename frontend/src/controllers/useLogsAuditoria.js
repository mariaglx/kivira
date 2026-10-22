import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import { mensagemErroCarregamento } from "../utils/erroCarregamento";
import { CATEGORIAS } from "../utils/auditoria";

const POR_PAGINA = 50;
const FILTROS_VAZIOS = { categoria: "", papel: "", busca: "", desde: "", ate: "" };

// Data do <input type="date"> (dia local) -> instante UTC que o backend entende.
// `fimDoDia` pega até o fim do dia escolhido.
function paraUtc(data, fimDoDia = false) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia + (fimDoDia ? 1 : 0)).toISOString();
}

function montarConsulta(filtros, deslocamento) {
  const parametros = new URLSearchParams({ limite: POR_PAGINA, deslocamento });
  const acoes = CATEGORIAS.find((c) => c.chave === filtros.categoria)?.acoes ?? [];
  if (acoes.length) parametros.set("acao", acoes.join(","));
  if (filtros.papel) parametros.set("papel", filtros.papel);
  if (filtros.busca.trim()) parametros.set("busca", filtros.busca.trim());
  if (filtros.desde) parametros.set("desde", paraUtc(filtros.desde));
  if (filtros.ate) parametros.set("ate", paraUtc(filtros.ate, true));
  return `/admin/logs-auditoria?${parametros}`;
}

// Logs de auditoria com filtros, "carregar mais" e o resumo das últimas 24h.
// Tudo sem o cache do apiRequest: aqui o que importa é o que acabou de acontecer.
export function useLogsAuditoria() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0); // "Atualizar" incrementa pra refazer a busca

  const alterarFiltro = (campo, valor) => setFiltros((atual) => ({ ...atual, [campo]: valor }));
  const limparFiltros = () => setFiltros(FILTROS_VAZIOS);
  const atualizar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    // Espera a pessoa parar de digitar na busca antes de consultar
    const timer = setTimeout(async () => {
      setCarregando(true);
      setErro("");
      try {
        const [pagina, dadosResumo] = await Promise.all([
          apiRequest(montarConsulta(filtros, 0), { signal: controller.signal, semCache: true }),
          apiRequest("/admin/logs-auditoria/resumo", { signal: controller.signal, semCache: true }),
        ]);
        setLogs(pagina.itens);
        setTotal(pagina.total);
        setResumo(dadosResumo);
      } catch (err) {
        if (err.name === "AbortError") return;
        setErro(mensagemErroCarregamento(err, "Não foi possível carregar a auditoria."));
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filtros, versao]);

  const carregarMais = async () => {
    setCarregandoMais(true);
    try {
      const pagina = await apiRequest(montarConsulta(filtros, logs.length), { semCache: true });
      setLogs((atuais) => [...atuais, ...pagina.itens]);
      setTotal(pagina.total);
    } catch (err) {
      setErro(mensagemErroCarregamento(err, "Não foi possível carregar mais registros."));
    } finally {
      setCarregandoMais(false);
    }
  };

  return {
    filtros, alterarFiltro, limparFiltros, atualizar,
    logs, total, resumo, carregando, carregandoMais, carregarMais, erro,
  };
}
