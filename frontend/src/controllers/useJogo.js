import { useState } from "react";
import { apiRequest } from "../services/api";

// Função utilitária para embaralhar as peças no início
function embaralhar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// `perguntas` já vem pronta de fora (montada em JogoAndamento.jsx a partir da
// atividade real) — cada item precisa de {id, texto_questao, resposta_certa},
// onde `id` é a ORDEM da questão (é ela que casa a peça certa com o slot certo,
// no estilo LUK). Como o fetch da atividade é assíncrono, `perguntas` chega
// vazia no primeiro render e só preenche depois — o efeito abaixo reage a essa
// chegada e inicializa o resto do estado do jogo nesse momento.
//
// `sessaoId`: quando existe (aluno jogando de verdade), virar o tabuleiro e
// reiniciar passam pelo servidor via /sessao_jogo — é ele quem confere o
// acerto e grava a partida. Quando é null (pré-visualização do professor),
// o jogo continua conferindo tudo localmente, sem gravar nada.
export function useJogo(perguntas = [], imagemAtividadeUrl = "/img/resultado.png", sessaoId = null) {
  // Compara com a referência anterior de `perguntas` pra saber se ela acabou de
  // chegar/trocar — sem useEffect (evita o "cascading render" que o eslint
  // acusa), seguindo o padrão do próprio React pra resetar estado quando um
  // parâmetro muda: ajusta direto durante a renderização.
  const [perguntasAnteriores, setPerguntasAnteriores] = useState(perguntas);
  const [pecasSoltas, setPecasSoltas] = useState(() => embaralhar(perguntas));
  const [tabuleiro, setTabuleiro] = useState({}); // Armazena { numeroSlot: pecaObjeto }
  const [pecaSelecionada, setPecaSelecionada] = useState(null);

  // Novos estados para o fluxo do jogo (LUK / Kivira)
  const [fase, setFase] = useState("jogando"); // "jogando" | "virado"
  const [resultados, setResultados] = useState({}); // { numeroSlot: true/false }
  const [processando, setProcessando] = useState(false); // aguardando resposta do servidor (virar/reiniciar)
  const [erroPartida, setErroPartida] = useState(null);
  // Preenchido quando o servidor confirma que a sessão concluiu (todas certas)
  const [resultadoConclusao, setResultadoConclusao] = useState(null);
  const [tentativas, setTentativas] = useState(0); // quantas vezes virou o tabuleiro (define as estrelas)

  if (perguntas !== perguntasAnteriores) {
    setPerguntasAnteriores(perguntas);
    setPecasSoltas(embaralhar(perguntas));
    setTabuleiro({});
    setResultados({});
    setPecaSelecionada(null);
    setTentativas(0);
    setFase("jogando");
    setResultadoConclusao(null);
  }

  // Ações existentes (adaptadas para guardar o objeto da peça inteira no tabuleiro)
  const selecionarPeca = (peca) => {
    if (fase !== "jogando") return;
    setPecaSelecionada(peca);
  };

  const encaixarNoTabuleiro = (numeroSlot) => {
    if (fase !== "jogando") return;

    const pecaAntiga = tabuleiro[numeroSlot];

    // Se o usuário clicou no slot e NÃO tem peça selecionada na mão,
    // ele quer remover a peça que já estava lá e devolvê-la para a mesa.
    if (!pecaSelecionada) {
      if (pecaAntiga) {
        const novoTabuleiro = { ...tabuleiro };
        delete novoTabuleiro[numeroSlot];
        setTabuleiro(novoTabuleiro);

        // Devolve a peça antiga para a lista de peças soltas
        setPecasSoltas((prev) => [...prev, pecaAntiga]);
      }
      return;
    }

    // Se ele tem uma peça selecionada na mão, faz o encaixe/troca comum:
    setTabuleiro({
      ...tabuleiro,
      [numeroSlot]: pecaSelecionada,
    });

    setPecasSoltas((prev) => {
      const filtradas = prev.filter((p) => p.id !== pecaSelecionada.id);
      return pecaAntiga ? [...filtradas, pecaAntiga] : filtradas;
    });

    setPecaSelecionada(null);
  };

  // Verifica as respostas e "vira" o tabuleiro para mostrar a imagem/resultado.
  // Sem sessão (preview do professor): confere tudo localmente, como sempre.
  // Com sessão (aluno jogando): o servidor confere e grava a rodada — o
  // resultado vem de volta na resposta, o cliente não decide o próprio acerto.
  const virarTabuleiro = async () => {
    if (!sessaoId) {
      const novosResultados = {};
      perguntas.forEach((q) => {
        const pecaNoSlot = tabuleiro[q.id];
        // No sistema LUK, a peça está certa se o ID dela bate com o ID do slot
        novosResultados[q.id] =
          pecaNoSlot !== undefined && pecaNoSlot.id === q.id;
      });

      setResultados(novosResultados);
      setTentativas((t) => t + 1);
      setFase("virado");
      return;
    }

    setErroPartida(null);
    setProcessando(true);
    try {
      const respostas = perguntas.map((q) => ({
        ordem_slot: q.id,
        ordem_peca: tabuleiro[q.id]?.id ?? null,
      }));

      const resposta = await apiRequest(`/sessao_jogo/${sessaoId}/conferir`, {
        method: "POST",
        data: { respostas },
      });

      setResultados(resposta.resultado_por_slot);
      // Conta a virada também no fluxo com servidor: é o que alimenta as
      // estrelas da tela do aluno. Só conta quando o tabuleiro realmente vira —
      // se a conferência falhar, a tentativa não entra.
      setTentativas((t) => t + 1);
      setFase("virado");
      if (resposta.concluida) {
        setResultadoConclusao({
          xpGanho: resposta.xp_ganho,
          xpTotalAluno: resposta.xp_total_aluno,
          nivelAtualAluno: resposta.nivel_atual_aluno,
        });
      }
    } catch (erro) {
      setErroPartida(erro.message || "Não foi possível conferir as respostas");
    } finally {
      setProcessando(false);
    }
  };

  // Desvira o tabuleiro e devolve APENAS as peças erradas para o usuário corrigir
  const corrigirRespostas = () => {
    const pecasParaDevolver = [];
    const novoTabuleiro = { ...tabuleiro };

    Object.keys(resultados).forEach((slotId) => {
      const numeroSlot = parseInt(slotId);
      if (!resultados[numeroSlot]) {
        // Se errou, tira do tabuleiro e joga na lista de devolução
        if (novoTabuleiro[numeroSlot]) {
          pecasParaDevolver.push(novoTabuleiro[numeroSlot]);
          delete novoTabuleiro[numeroSlot];
        }
      }
    });

    setTabuleiro(novoTabuleiro);
    setPecasSoltas((prev) => [...prev, ...pecasParaDevolver]);
    setResultados({});
    setFase("jogando");
  };

  // Atalho para saber se todos os slots foram preenchidos
  const todosSlotsPreenchidos =
    Object.keys(tabuleiro).length === perguntas.length;

  const [pecaDraggin, setPecaDraggin] = useState(null);

  // Chamado na View assim que o usuário começa a arrastar a peça solta
  const iniciarDrag = (peca) => {
    if (fase !== "jogando") return;
    setPecaDraggin(peca);
  };

  // Chamado na View quando o usuário solta a peça em cima de um slot do tabuleiro
  const dropNoTabuleiro = (numeroSlot) => {
    if (!pecaDraggin || fase !== "jogando") return;

    const pecaAntiga = tabuleiro[numeroSlot];

    setTabuleiro({
      ...tabuleiro,
      [numeroSlot]: pecaDraggin,
    });

    setPecasSoltas((prev) => {
      const filtradas = prev.filter((p) => p.id !== pecaDraggin.id);
      return pecaAntiga ? [...filtradas, pecaAntiga] : filtradas;
    });

    // Limpa o estado de arrasto
    setPecaDraggin(null);
  };

  // "Começar do zero": com sessão, avisa o servidor primeiro (NÃO conta como
  // abandono — só zera o progresso da rodada atual e soma em `reinicios`)
  // antes de limpar o tabuleiro local. Sem sessão (preview), é só local.
  const reiniciarJogo = async () => {
    if (sessaoId) {
      setErroPartida(null);
      setProcessando(true);
      try {
        await apiRequest(`/sessao_jogo/${sessaoId}/reiniciar`, { method: "POST" });
      } catch (erro) {
        setErroPartida(erro.message || "Não foi possível reiniciar a partida");
        setProcessando(false);
        return;
      }
      setProcessando(false);
    }

    setTabuleiro({});
    setResultados({});
    setPecaSelecionada(null);
    setPecaDraggin(null);
    setTentativas(0);
    setFase("jogando");
    setResultadoConclusao(null);
    setPecasSoltas(embaralhar(perguntas));
  };

  return {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
    tentativas,
    todosSlotsPreenchidos,
    imagemAtividadeUrl,
    processando,
    erroPartida,
    resultadoConclusao,
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
    reiniciarJogo,
  };
}
