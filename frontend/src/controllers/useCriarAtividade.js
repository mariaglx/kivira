import { useState } from "react";
import { apiRequest } from "../services/api";

export function useCriarAtividade() {
  const [formData, setFormData] = useState({
    titulo: "",
    tipo_atividade: "arrastar_soltar",
    turma_id: "",
    descricao: "",
    disciplina: "",
    dificuldade: "facil",
    imagem_atividade_url: "",
    quantidade_blocos: 12,
    tempo_limite_seg: "",
    serie_ano: "", // usado só como contexto pra IA, não é persistido na atividade
  });

  // Uma questão por bloco — a lista sempre tem o mesmo tamanho de formData.quantidade_blocos
  // localId nunca muda (mesmo quando "ordem" é renumerado) — usado como key, pra não confundir o React na animação
  const criarQuestaoVazia = (ordem) => ({
    localId: crypto.randomUUID(),
    ordem,
    texto_questao: "",
    resposta_certa: "",
    questaoId: null,
    opcaoId: null,
  });

  const [questoes, setQuestoes] = useState(
    Array.from({ length: 12 }, (_, i) => criarQuestaoVazia(i + 1))
  );

  const [questoesParaRemover, setQuestoesParaRemover] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "quantidade_blocos") {
      const novaQuantidade = parseInt(value) || 0;

      if (novaQuantidade < questoes.length) {
        const removidas = questoes.slice(novaQuantidade).filter((q) => q.questaoId);
        setQuestoesParaRemover([...questoesParaRemover, ...removidas.map((q) => q.questaoId)]);
      }

      setQuestoes((atual) => {
        if (novaQuantidade > atual.length) {
          const novosBlocos = Array.from(
            { length: novaQuantidade - atual.length },
            (_, i) => criarQuestaoVazia(atual.length + i + 1)
          );
          return [...atual, ...novosBlocos];
        }
        return atual.slice(0, novaQuantidade);
      });
    }
  };

  const handleChangeBloco = (index, campo, valor) => {
    setQuestoes((atual) =>
      atual.map((questao, i) => (i === index ? { ...questao, [campo]: valor } : questao))
    );
  };

  const adicionarQuestao = () => {
    const novaQuestao = criarQuestaoVazia(questoes.length + 1);
    setQuestoes((atual) => [...atual, novaQuestao]);
    setFormData((atual) => ({
      ...atual,
      quantidade_blocos: (parseInt(atual.quantidade_blocos) || 0) + 1,
    }));
    return novaQuestao;
  };

  const removerQuestao = (index) => {
    const questaoRemovida = questoes[index];
    if (questaoRemovida.questaoId) {
      setQuestoesParaRemover((atual) => [...atual, questaoRemovida.questaoId]);
    }
    setQuestoes((atual) =>
      atual.filter((_, i) => i !== index).map((questao, i) => ({ ...questao, ordem: i + 1 }))
    );
    setFormData((atual) => ({
      ...atual,
      quantidade_blocos: (parseInt(atual.quantidade_blocos) || 0) - 1,
    }));
  };

  const moverQuestao = (origemIndex, destinoIndex) => {
    if (origemIndex === -1 || destinoIndex === -1 || origemIndex === destinoIndex) return;

    setQuestoes((atual) => {
      const copia = [...atual];
      const [questaoMovida] = copia.splice(origemIndex, 1);
      copia.splice(destinoIndex, 0, questaoMovida);
      return copia.map((questao, i) => ({ ...questao, ordem: i + 1 }));
    });
  };

  const [gerandoIA, setGerandoIA] = useState(false);
  const [erroIA, setErroIA] = useState(null);

  // Chama a IA (Ollama/llama3) só para preencher os blocos ainda vazios, respeitando
  // o que o professor já escreveu manualmente como padrão/contexto
  const gerarQuestoesComIA = async () => {
    setErroIA(null);

    const questoesPreenchidas = questoes.filter(
      (q) => q.texto_questao.trim() && q.resposta_certa.trim()
    );
    const indicesVazios = questoes
      .map((q, i) => (q.texto_questao.trim() || q.resposta_certa.trim() ? null : i))
      .filter((i) => i !== null);

    if (indicesVazios.length === 0) {
      setErroIA("Todos os blocos já estão preenchidos.");
      return;
    }

    setGerandoIA(true);
    try {
      const resposta = await apiRequest("/ia/gerar_questoes", {
        method: "POST",
        data: {
          serie_ano: formData.serie_ano,
          disciplina: formData.disciplina,
          titulo: formData.titulo,
          dificuldade: formData.dificuldade,
          descricao: formData.descricao || null,
          quantidade_total: questoes.length,
          questoes_existentes: questoesPreenchidas.map((q) => ({
            texto_questao: q.texto_questao,
            resposta_certa: q.resposta_certa,
          })),
        },
      });

      const geradas = resposta.questoes_geradas || [];
      setQuestoes((atual) =>
        atual.map((questao, i) => {
          const posicao = indicesVazios.indexOf(i);
          if (posicao === -1 || posicao >= geradas.length) return questao;
          return {
            ...questao,
            texto_questao: geradas[posicao].texto_questao,
            resposta_certa: geradas[posicao].resposta_certa,
          };
        })
      );
    } catch (erro) {
      setErroIA(erro.message || "Erro ao gerar questões com IA");
    } finally {
      setGerandoIA(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    questoes,
    setQuestoes,
    questoesParaRemover,
    setQuestoesParaRemover,
    handleChangeBloco,
    adicionarQuestao,
    removerQuestao,
    moverQuestao,
    gerandoIA,
    erroIA,
    setErroIA,
    gerarQuestoesComIA,
  };
}