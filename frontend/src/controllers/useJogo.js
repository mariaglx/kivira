import { useState } from "react";

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
export function useJogo(perguntas = [], imagemAtividadeUrl = "/img/resultado.png") {
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

  if (perguntas !== perguntasAnteriores) {
    setPerguntasAnteriores(perguntas);
    setPecasSoltas(embaralhar(perguntas));
    setTabuleiro({});
    setResultados({});
    setPecaSelecionada(null);
    setFase("jogando");
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

  // Verifica as respostas e "vira" o tabuleiro para mostrar a imagem/resultado
  const virarTabuleiro = () => {
    const novosResultados = {};
    perguntas.forEach((q) => {
      const pecaNoSlot = tabuleiro[q.id];
      // No sistema LUK, a peça está certa se o ID dela bate com o ID do slot
      novosResultados[q.id] =
        pecaNoSlot !== undefined && pecaNoSlot.id === q.id;
    });

    setResultados(novosResultados);
    setFase("virado");
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

  const reiniciarJogo = () => {
    setTabuleiro({});
    setResultados({});
    setPecaSelecionada(null);
    setPecaDraggin(null);
    setFase("jogando");
    setPecasSoltas(embaralhar(perguntas));
  };

  return {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
    todosSlotsPreenchidos,
    imagemAtividadeUrl,
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
    reiniciarJogo,
  };
}
