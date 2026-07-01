import { useState } from "react";

// Função utilitária para embaralhar as peças no início
function embaralhar(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function useJogoController() {
  const perguntasIniciais = [
    {
      id: 1,
      texto_questao: "Qual o som que a vaca faz?",
      resposta_certa: "Muuuu",
    },
    {
      id: 2,
      texto_questao: "Qual o som que o cachorro faz?",
      resposta_certa: "Au au",
    },
    {
      id: 3,
      texto_questao: "Qual o som que o gato faz?",
      resposta_certa: "Miau",
    },
    {
      id: 4,
      texto_questao: "Qual o som que o passarinho faz?",
      resposta_certa: "Piu piu",
    },
    {
      id: 5,
      texto_questao: "Qual o som que a galinha faz?",
      resposta_certa: "Cocoricó",
    },
    {
      id: 6,
      texto_questao: "Qual o som que o leão faz?",
      resposta_certa: "Roar!",
    },
    {
      id: 7,
      texto_questao: "Qual o som que o pato faz?",
      resposta_certa: "Quack!",
    },
    {
      id: 8,
      texto_questao: "Qual o som que a cobra faz?",
      resposta_certa: "Ssss",
    },
    {
      id: 9,
      texto_questao: "Qual o som que o grilo faz?",
      resposta_certa: "Cricri cricri",
    },
    {
      id: 10,
      texto_questao: "Qual o som que a cabra faz?",
      resposta_certa: "Béeeh",
    },
    {
      id: 11,
      texto_questao: "Qual o som que o cavalo faz?",
      resposta_certa: "Hiii",
    },
    {
      id: 12,
      texto_questao: "Qual o som que a ovelha faz?",
      resposta_certa: "Mêeeh",
    },
  ];

  // Estados principais
  const [perguntas] = useState(perguntasIniciais);
  const [pecasSoltas, setPecasSoltas] = useState(() =>
    embaralhar(perguntasIniciais),
  );
  const [tabuleiro, setTabuleiro] = useState({}); // Armazena { numeroSlot: pecaObjeto }
  const [pecaSelecionada, setPecaSelecionada] = useState(null);

  // Novos estados para o fluxo do jogo (LUK / Kivira)
  const [fase, setFase] = useState("jogando"); // "jogando" | "virado"
  const [resultados, setResultados] = useState({}); // { numeroSlot: true/false }

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

  return {
    perguntas,
    pecasSoltas,
    tabuleiro,
    pecaSelecionada,
    fase,
    resultados,
    todosSlotsPreenchidos,
    selecionarPeca,
    encaixarNoTabuleiro,
    virarTabuleiro,
    corrigirRespostas,
    iniciarDrag,
    dropNoTabuleiro,
  };
}
