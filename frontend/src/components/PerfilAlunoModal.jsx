import { useEffect, useState } from "react";
import { Avatar } from "./ui/Avatar";
import { BarraProgresso } from "./ui/BarraProgresso";
import { Carregando } from "./ui/Carregando";
import { apiRequest } from "../services/api";
import { progressoNivel } from "../utils/xp";

// Cartão de perfil que abre ao clicar no bichinho de um aluno, estilo Discord.
// Vive em components/ (não em components/aluno/) porque as duas áreas usam:
// a lista de colegas do aluno e a lista de alunos do professor.
//
// Busca o perfil em vez de receber por prop: a lista de colegas traz nome,
// avatar, XP e nível, mas não as conquistas — e carregar conquista de turma
// inteira só pra talvez abrir uma seria desperdício. Aqui é uma chamada só,
// no clique.
export function PerfilAlunoModal({ alunoId, onFechar }) {
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    apiRequest(`/aluno/${alunoId}/perfil`)
      .then((dados) => ativo && setPerfil(dados))
      .catch((e) => ativo && setErro(e.message || "Não foi possível abrir o perfil."));
    return () => {
      ativo = false;
    };
  }, [alunoId]);

  // Esc fecha, como em qualquer modal do sistema operacional
  useEffect(() => {
    const aoTeclar = (e) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const progresso = perfil ? progressoNivel(perfil.xp_total) : null;

  return (
    <div
      className="fixed inset-0 bg-azul/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onFechar}
    >
      {/* para o clique dentro do cartão não fechar junto com o do fundo */}
      <div
        className="bg-branco rounded-3xl w-full max-w-sm shadow-xl overflow-hidden animate__animated animate__zoomIn animate__faster"
        onClick={(e) => e.stopPropagation()}
      >
        {erro ? (
          <p className="p-8 text-center text-sm font-semibold text-red-600">{erro}</p>
        ) : !perfil ? (
          <div className="p-10">
            <Carregando embutido texto="Abrindo perfil..." />
          </div>
        ) : (
          <>
            {/* faixa colorida atrás do avatar, igual o banner do Discord */}
            <div className="h-20 bg-coral/20" />

            <div className="px-6 pb-6 -mt-10">
              <Avatar
                arquivo={perfil.avatar_url}
                nome={perfil.nome}
                className="w-20 h-20 text-2xl rounded-2xl ring-4 ring-branco"
              />

              <h2 className="mt-3 text-xl font-black text-azul truncate">{perfil.nome}</h2>

              <div className="mt-4 bg-bege/60 rounded-2xl p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-extrabold text-coral">
                    Nível {perfil.nivel_atual}
                  </span>
                  <span className="text-xs font-bold text-azul/50">
                    {progresso.xpNoNivel}/{progresso.xpDoNivel} XP
                  </span>
                </div>
                <BarraProgresso valor={progresso.xpNoNivel} max={progresso.xpDoNivel} />
              </div>

              <h3 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-azul/40">
                Conquistas ({perfil.conquistas.filter((c) => c.desbloqueada).length}/
                {perfil.conquistas.length})
              </h3>

              {/* p-1 -m-1 porque o overflow corta o ring dos itens (ver DESIGN_SYSTEM) */}
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 -m-1">
                {perfil.conquistas.map((c) => (
                  <div
                    key={c.codigo}
                    title={`${c.nome}: ${c.descricao}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-center px-1 ${
                      c.desbloqueada
                        ? "bg-laranja-claro/40 ring-1 ring-coral/30"
                        : "bg-azul/5 opacity-40 grayscale"
                    }`}
                  >
                    <span className="text-xl leading-none">{c.emoji}</span>
                    <span className="text-[9px] font-bold text-azul/70 leading-tight truncate w-full">
                      {c.nome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PerfilAlunoModal;
