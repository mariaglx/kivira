import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { Search } from "lucide-react";
import { OPCOES_PAPEL, BADGE_POR_PAPEL, LABEL_POR_PAPEL } from "../../utils/papeis";
import { mensagemErroCarregamento } from "../../utils/erroCarregamento";
import { useVerComo } from "../../controllers/useVerComo";
import { Modal } from "../../components/ui/Animacao";
import { Alerta } from "../../components/ui/Alerta";

export function Usuarios() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState("");
  const { verComo, abrindo, erro: erroVerComo } = useVerComo();

  const [usuarioParaPromover, setUsuarioParaPromover] = useState(null);
  const [promovendo, setPromovendo] = useState(false);
  const [erroPromocao, setErroPromocao] = useState("");
  const [codigo2fa, setCodigo2fa] = useState("");

  useEffect(() => {
    let cancelado = false;
    const controller = new AbortController();

    async function carregarUsuarios() {
      setCarregando(true);
      setErro("");
      try {
        const parametros = new URLSearchParams();
        if (tipoFiltro) parametros.set("tipo", tipoFiltro);
        const query = parametros.toString();
        const resposta = await apiRequest(`/admin/usuarios${query ? `?${query}` : ""}`, {
          signal: controller.signal,
        });
        if (!cancelado) setUsuarios(Array.isArray(resposta) ? resposta : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Erro ao carregar usuários:", err.message);
        setErro(mensagemErroCarregamento(err, "Não foi possível carregar os usuários."));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarUsuarios();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [tipoFiltro]);

  const termo = busca.trim().toLowerCase();
  const usuariosFiltrados = usuarios.filter((usuario) =>
    `${usuario.nome ?? ""} ${usuario.identificador ?? ""} ${usuario.turmas.join(" ")}`.toLowerCase().includes(termo)
  );

  const abrirConfirmacaoPromover = (usuario) => {
    setErroPromocao("");
    setCodigo2fa("");
    setUsuarioParaPromover(usuario);
  };

  const fecharConfirmacaoPromover = () => {
    if (promovendo) return;
    setUsuarioParaPromover(null);
  };

  const confirmarPromover = async () => {
    if (!usuarioParaPromover) return;
    setPromovendo(true);
    setErroPromocao("");
    try {
      await apiRequest(`/admin/usuarios/${usuarioParaPromover.id}/promover-admin`, {
        method: "POST",
        data: { codigo: codigo2fa },
      });
      setUsuarios((lista) =>
        lista.map((u) => (u.id === usuarioParaPromover.id ? { ...u, tipo: "admin" } : u))
      );
      setUsuarioParaPromover(null);
    } catch (err) {
      setErroPromocao(err.message || "Não foi possível promover este usuário.");
      setCodigo2fa("");
    } finally {
      setPromovendo(false);
    }
  };

  // Conta nunca é apagada: o admin desativa/reativa aluno e professor (admin não)
  const [alternandoId, setAlternandoId] = useState(null);
  const [erroConta, setErroConta] = useState("");

  const alternarConta = async (usuario) => {
    const url = usuario.aluno_id ? `/aluno/${usuario.aluno_id}/ativo` : `/professor/${usuario.professor_id}/ativo`;
    setAlternandoId(usuario.id);
    setErroConta("");
    try {
      const { ativo } = await apiRequest(url, { method: "PATCH", data: { ativo: !usuario.ativo } });
      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, ativo } : u)));
    } catch (err) {
      setErroConta(err.message || "Não foi possível alterar essa conta.");
    } finally {
      setAlternandoId(null);
    }
  };

  return (
    <main className="pagina flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="text-sm text-azul/80">
            Todos os usuários cadastrados no sistema: alunos, professores e admins.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/80 text-sm">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, login ou turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder:text-azul/75 shadow-sm transition-all text-sm"
          />
        </div>

        <div className="w-full sm:max-w-[220px]">
          <SelectCustom
            name="tipo"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            options={OPCOES_PAPEL}
            placeholder="Filtrar por papel"
          />
        </div>
      </div>

      {erroConta && (
        <Alerta>{erroConta}</Alerta>
      )}

      {erroVerComo && (
        <Alerta>{erroVerComo}</Alerta>
      )}

      {erro && (
        <Alerta>
          {erro}
        </Alerta>
      )}

      {carregando ? (
        <p className="text-azul/80">Carregando usuários...</p>
      ) : (
        <div className="bg-branco rounded-2xl shadow-sm border border-cinza-claro/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left rotulo border-b border-cinza-claro/20">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Login</th>
                <th className="px-5 py-3">Papel</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3">Primeiro acesso</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="border-b border-cinza-claro/10 last:border-0">
                  <td className="px-5 py-3 text-azul/80">{usuario.id}</td>
                  <td className="px-5 py-3 font-medium text-azul">
                    {usuario.nome || "—"}
                    {usuario.turmas.length > 0 && (
                      <span className="block text-xs font-normal text-azul/80">{usuario.turmas.join(", ")}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-azul/80">{usuario.identificador || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`badge border-none rounded-md px-2.5 py-1 text-xs font-bold ${BADGE_POR_PAPEL[usuario.tipo] || "bg-cinza-claro/20 text-azul/80"}`}>
                      {LABEL_POR_PAPEL[usuario.tipo] || usuario.tipo}
                    </span>
                    {!usuario.ativo && (
                      <span className="badge border-none rounded-md px-2.5 py-1 text-xs font-bold bg-vermelho/10 text-vermelho ml-1">
                        Desativado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-azul/80">
                    {usuario.data_criacao ? new Date(usuario.data_criacao).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-3 text-azul/80">
                    {usuario.primeiro_acesso ? "Sim" : "Não"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {usuario.aluno_id && usuario.ativo && (
                        <button
                          type="button"
                          onClick={() => verComo("aluno", usuario.aluno_id)}
                          disabled={abrindo === `aluno:${usuario.aluno_id}`}
                          className="alvo-toque text-xs font-bold text-azul hover:underline whitespace-nowrap"
                        >
                          {abrindo === `aluno:${usuario.aluno_id}` ? "Abrindo..." : "Ver como aluno"}
                        </button>
                      )}
                      {usuario.tipo === "professor" && usuario.professor_id && usuario.ativo && (
                        <button
                          type="button"
                          onClick={() => verComo("professor", usuario.professor_id)}
                          disabled={abrindo === `professor:${usuario.professor_id}`}
                          className="alvo-toque text-xs font-bold text-azul hover:underline whitespace-nowrap"
                        >
                          {abrindo === `professor:${usuario.professor_id}` ? "Abrindo..." : "Ver como professor"}
                        </button>
                      )}
                      {(usuario.aluno_id || (usuario.tipo === "professor" && usuario.professor_id)) && (
                        <button
                          type="button"
                          onClick={() => alternarConta(usuario)}
                          disabled={alternandoId === usuario.id}
                          className={`alvo-toque text-xs font-bold hover:underline whitespace-nowrap ${usuario.ativo ? "text-vermelho" : "text-azul"}`}
                        >
                          {alternandoId === usuario.id ? "Salvando..." : usuario.ativo ? "Desativar" : "Reativar"}
                        </button>
                      )}
                      {/* Só professor (ativo) vira admin — o backend recusa aluno */}
                      {usuario.tipo === "professor" && usuario.ativo && (
                        <button
                          type="button"
                          onClick={() => abrirConfirmacaoPromover(usuario)}
                          className="alvo-toque text-xs font-bold text-coral-texto hover:underline whitespace-nowrap"
                        >
                          Tornar admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-azul/80">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {usuarioParaPromover && (
        <Modal aberto onFechar={promovendo ? undefined : fecharConfirmacaoPromover} className="max-w-sm">
            <p className="font-extrabold text-azul text-lg mb-2">Tornar admin?</p>
            <p className="text-sm text-azul/80 mb-1">
              <span className="font-semibold text-azul">{usuarioParaPromover.nome || usuarioParaPromover.identificador}</span> passará
              a ter acesso irrestrito ao sistema: gestão de todos os usuários, turmas e logs de
              auditoria.
            </p>
            <p className="text-sm text-azul/80 mb-4">Essa ação fica registrada no log de auditoria.</p>

            <label htmlFor="codigo-2fa-promover" className="block text-sm font-bold text-azul mb-1.5">
              Código do seu app autenticador
            </label>
            <input
              id="codigo-2fa-promover"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo2fa}
              onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, ""))}
              className="w-full mb-5 px-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul text-center tracking-[0.4em]"
            />

            {erroPromocao && (
              <Alerta className="mb-4">
                {erroPromocao}
              </Alerta>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={fecharConfirmacaoPromover}
                disabled={promovendo}
                className="px-4 py-2 rounded-xl text-sm font-bold text-azul/80 hover:bg-bege/60 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarPromover}
                disabled={promovendo || codigo2fa.length !== 6}
                className="btn bg-coral hover:bg-coral/90 text-azul-escuro border-none rounded-xl px-4 py-2 h-auto min-h-0 text-sm font-bold normal-case shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {promovendo ? "Promovendo..." : "Confirmar"}
              </button>
            </div>
        </Modal>
      )}
    </main>
  );
}

export default Usuarios;
