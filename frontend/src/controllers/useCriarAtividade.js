import { useState } from "react";

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
  };
}