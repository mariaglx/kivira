import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { SelectCustom } from "../../components/ui/SelectCustom";
import { SearchIcon } from "../../components/icons/search";

const OPCOES_TIPO = [
  { value: "", label: "Todos os papéis" },
  { value: "admin", label: "Admin" },
  { value: "professor", label: "Professor" },
  { value: "estudante", label: "Aluno" },
];

const BADGE_POR_TIPO = {
  admin: "bg-azul/10 text-azul",
  professor: "bg-blue-100 text-blue-600",
  estudante: "bg-green-100 text-green-600",
};

const LABEL_POR_TIPO = {
  admin: "Admin",
  professor: "Professor",
  estudante: "Aluno",
};

export function Usuarios() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState("");

  const [usuarioParaPromover, setUsuarioParaPromover] = useState(null);
  const [promovendo, setPromovendo] = useState(false);
  const [erroPromocao, setErroPromocao] = useState("");

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
        if (err.message?.includes("permissão") || err.message?.includes("403")) {
          setErro("Você não tem permissão para acessar esta área.");
        } else if (err.message?.includes("Token") || err.message?.includes("401") || err.message?.includes("Acesso")) {
          localStorage.removeItem("access_token");
          navigate("/login");
        } else {
          setErro("Não foi possível carregar os usuários.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarUsuarios();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [tipoFiltro, navigate]);

  const usuariosFiltrados = usuarios.filter((usuario) =>
    (usuario.email || "").toLowerCase().includes(busca.toLowerCase())
  );

  const abrirConfirmacaoPromover = (usuario) => {
    setErroPromocao("");
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
      });
      setUsuarios((lista) =>
        lista.map((u) => (u.id === usuarioParaPromover.id ? { ...u, tipo: "admin" } : u))
      );
      setUsuarioParaPromover(null);
    } catch (err) {
      setErroPromocao(err.message || "Não foi possível promover este usuário.");
    } finally {
      setPromovendo(false);
    }
  };

  return (
    <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="text-sm text-azul/50">
            Todos os usuários cadastrados no sistema — alunos, professores e admins.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-azul/40 text-sm">
            <SearchIcon size={16} isAnimated={false} />
          </span>
          <input
            type="text"
            placeholder="Buscar por e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-cinza-claro/30 bg-branco text-azul placeholder-azul/40 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral/50 shadow-sm transition-all text-sm"
          />
        </div>

        <div className="w-full max-w-[220px]">
          <SelectCustom
            name="tipo"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            options={OPCOES_TIPO}
            placeholder="Filtrar por papel"
          />
        </div>
      </div>

      {erro && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {erro}
        </div>
      )}

      {carregando ? (
        <p className="text-azul/60">Carregando usuários...</p>
      ) : (
        <div className="bg-branco rounded-2xl shadow-sm border border-cinza-claro/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-azul/40 font-bold border-b border-cinza-claro/20">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Papel</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3">Primeiro acesso</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="border-b border-cinza-claro/10 last:border-0">
                  <td className="px-5 py-3 text-azul/60">{usuario.id}</td>
                  <td className="px-5 py-3 font-medium text-azul">{usuario.email || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`badge border-none rounded-md px-2.5 py-1 text-[10px] font-bold ${BADGE_POR_TIPO[usuario.tipo] || "bg-cinza-claro/20 text-azul/60"}`}>
                      {LABEL_POR_TIPO[usuario.tipo] || usuario.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-azul/60">
                    {usuario.data_criacao ? new Date(usuario.data_criacao).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-3 text-azul/60">
                    {usuario.primeiro_acesso ? "Sim" : "Não"}
                  </td>
                  <td className="px-5 py-3">
                    {usuario.tipo !== "admin" && (
                      <button
                        type="button"
                        onClick={() => abrirConfirmacaoPromover(usuario)}
                        className="text-xs font-bold text-coral hover:underline"
                      >
                        Tornar admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-azul/50">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {usuarioParaPromover && (
        <div className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-branco rounded-3xl shadow-xl max-w-sm w-full p-6">
            <p className="font-extrabold text-azul text-lg mb-2">Tornar admin?</p>
            <p className="text-sm text-azul/60 mb-1">
              <span className="font-semibold text-azul">{usuarioParaPromover.email}</span> passará
              a ter acesso irrestrito ao sistema — gestão de todos os usuários, turmas e logs de
              auditoria.
            </p>
            <p className="text-sm text-azul/60 mb-5">Essa ação fica registrada no log de auditoria.</p>

            {erroPromocao && (
              <div className="mb-4 p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {erroPromocao}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={fecharConfirmacaoPromover}
                disabled={promovendo}
                className="px-4 py-2 rounded-xl text-sm font-bold text-azul/60 hover:bg-bege/60 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarPromover}
                disabled={promovendo}
                className="btn bg-coral hover:bg-coral/90 text-branco border-none rounded-xl px-4 py-2 h-auto min-h-0 text-sm font-bold normal-case shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {promovendo ? "Promovendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Usuarios;
