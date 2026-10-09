import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { comemorar } from "../utils/comemorar";

// O backend devolve as listas na ordem de criação, mas a professora procura
// por nome. Ordena sempre pelo mesmo texto que aparece na tela, e com
// localeCompare pt-BR — senão acento manda "Vinícius" pra depois de "Vitor"
const ordenarPorTexto = (lista, rotulo) =>
  [...lista].sort((a, b) =>
    (rotulo(a) || "").localeCompare(rotulo(b) || "", "pt-BR", {
      sensitivity: "base",
    }),
  );

// Contador de módulo (não estado/ref) só pra dar uma chave própria a cada
// linha do formulário de cadastro — senão remover uma linha do meio reaproveita
// a key de outra e o React pode confundir o estado dos campos
let proximaChaveLinha = 1;
const linhaVazia = () => ({
  chave: proximaChaveLinha++,
  nome: "",
  sobrenome: "",
  matricula: "",
});

const FORM_VAZIO = {
  nome: "",
  ano_escolar: "",
  ano_letivo: new Date().getFullYear(),
  descricao: "",
  ativo: true,
};

export function useTurmaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modoEdicao = !!id;

  const [formData, setFormData] = useState(FORM_VAZIO);
  const [dadosOriginais, setDadosOriginais] = useState(null);
  const [codigoAcesso, setCodigoAcesso] = useState(null);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Alunos e atividades só existem quando a turma já foi criada — uma "Nova
  // Turma" não tem id ainda pra buscar nada disso
  const [alunos, setAlunos] = useState([]);
  const [atividades, setAtividades] = useState([]);

  // Ranking vem pronto do servidor (ordenado por XP, com as atividades
  // concluídas contadas lá) — o denominador é só o que está publicado, por
  // isso não dá pra usar `atividades.length` daqui no lugar dele.
  const [rankingAlunos, setRankingAlunos] = useState([]);
  const [totalAtividadesPublicadas, setTotalAtividadesPublicadas] = useState(0);

  useEffect(() => {
    if (!modoEdicao) return;

    let cancelado = false;
    const controller = new AbortController();
    const opcoesFetch = { signal: controller.signal };

    // /atividade/professor/minhas?turma_id=<id>: antes buscava TODAS as
    // atividades do professor (de todas as turmas) só pra filtrar no cliente
    // as dessa turma — quanto mais atividades o professor tivesse, mais lento
    // ficava abrir qualquer turma pra editar.
    Promise.all([
      apiRequest(`/turma/${id}`, opcoesFetch),
      apiRequest(`/aluno_turma/turma/${id}`, opcoesFetch),
      apiRequest(`/atividade/professor/minhas?turma_id=${id}`, opcoesFetch),
      apiRequest(`/turma/${id}/ranking`, opcoesFetch),
    ])
      .then(([turma, dadosAlunos, dadosAtividades, dadosRanking]) => {
        if (cancelado) return;
        const carregado = {
          nome: turma.nome || "",
          ano_escolar: turma.ano_escolar || "",
          ano_letivo: turma.ano_letivo || new Date().getFullYear(),
          descricao: turma.descricao || "",
          ativo: turma.ativo ?? true,
        };
        setFormData(carregado);
        // Foto do que veio do banco: é contra ela que a tela decide se há
        // alteração pendente. Alunos e atividades ficam de fora de propósito —
        // eles são salvos na hora, por conta própria, não dependem deste form.
        setDadosOriginais(carregado);
        setCodigoAcesso(turma.codigo_acesso || null);
        setAlunos(
          ordenarPorTexto(dadosAlunos, (a) => a.apelido || a.nome_completo),
        );
        setAtividades(ordenarPorTexto(dadosAtividades, (a) => a.titulo));
        setRankingAlunos(dadosRanking.ranking || []);
        setTotalAtividadesPublicadas(dadosRanking.total_atividades || 0);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setErro(err.message || "Não foi possível carregar a turma");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [id, modoEdicao]);

  const recarregarAlunos = () => {
    apiRequest(`/aluno_turma/turma/${id}`).then((lista) =>
      setAlunos(ordenarPorTexto(lista, (a) => a.apelido || a.nome_completo)),
    );
    // Entrar/sair da turma muda quem aparece no ranking, então ele recarrega junto
    apiRequest(`/turma/${id}/ranking`).then((dados) => {
      setRankingAlunos(dados.ranking || []);
      setTotalAtividadesPublicadas(dados.total_atividades || 0);
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Só os campos do formulário entram na conta. Adicionar ou remover aluno não
  // "suja" a turma: essas ações já vão pro banco na hora, por rota própria.
  const houveAlteracao =
    !modoEdicao ||
    (dadosOriginais !== null &&
      JSON.stringify(formData) !== JSON.stringify(dadosOriginais));

  // "Cancelar" ao lado de "Salvar" desfaz a edição em vez de sair da tela —
  // mesma regra já adotada na tela de atividade
  const desfazerAlteracoes = () => {
    if (dadosOriginais) setFormData(dadosOriginais);
    setErro(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (salvando) return;

    setSalvando(true);
    setErro(null);
    try {
      const corpo = {
        nome: formData.nome,
        ano_escolar: formData.ano_escolar,
        ano_letivo: Number(formData.ano_letivo),
        descricao: formData.descricao || null,
        ativo: formData.ativo,
      };

      if (modoEdicao) {
        await apiRequest(`/turma/${id}`, { method: "PATCH", data: corpo });
        // Fica na tela: o professor costuma continuar mexendo em alunos e
        // atividades da turma depois de salvar. O que veio de volta vira o novo
        // "original", então os botões somem sozinhos — é esse o aviso de que
        // salvou, sem precisar de modal.
        setDadosOriginais(formData);
        comemorar();
      } else {
        const resposta = await apiRequest("/turma/criar", {
          method: "POST",
          data: corpo,
        });
        comemorar();
        navigate(resposta.id ? `/professor/turmas/${resposta.id}/editar` : "/professor/turmas");
      }
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a turma");
    } finally {
      setSalvando(false);
    }
  };

  // Cadastro de aluno(s) de dentro da turma — uma lista de linhas (nome,
  // sobrenome, matrícula) que cresce com o "+". 1 linha preenchida ou 30 são
  // o mesmo caminho: sempre o endpoint em lote, mesmo pra um aluno só — não
  // faz sentido manter dois fluxos separados pra "a mesma coisa"
  const [modalAlunoAberto, setModalAlunoAberto] = useState(false);
  const [abaModalAluno, setAbaModalAluno] = useState("cadastrar"); // "cadastrar" | "existente"

  const [linhasCadastro, setLinhasCadastro] = useState(() => [linhaVazia()]);

  const abrirModalAluno = () => {
    setAbaModalAluno("cadastrar");
    setLinhasCadastro([linhaVazia()]);
    setResultadoLote(null);
    setErroCadastroLote(null);
    setBuscaAlunoExistente("");
    setResultadosBusca([]);
    setErroMatricularExistente(null);
    setModalAlunoAberto(true);
  };

  const fecharModalAluno = () => {
    setModalAlunoAberto(false);
  };

  const alterarLinhaCadastro = (chave, campo, valor) => {
    setLinhasCadastro((atual) =>
      atual.map((linha) => (linha.chave === chave ? { ...linha, [campo]: valor } : linha)),
    );
  };

  const adicionarLinhaCadastro = () => {
    setLinhasCadastro((atual) => [...atual, linhaVazia()]);
  };

  // Nunca deixa a lista vazia — sem nenhuma linha não tem onde digitar o próximo
  const removerLinhaCadastro = (chave) => {
    setLinhasCadastro((atual) =>
      atual.length > 1 ? atual.filter((linha) => linha.chave !== chave) : atual,
    );
  };

  const [cadastrandoLote, setCadastrandoLote] = useState(false);
  const [erroCadastroLote, setErroCadastroLote] = useState(null);
  const [resultadoLote, setResultadoLote] = useState(null); // [{nome_completo, matricula, username, senha_temporaria}]

  const itensLote = linhasCadastro
    .map((linha) => ({
      nome_completo: `${linha.nome.trim()} ${linha.sobrenome.trim()}`.trim(),
      matricula: linha.matricula.trim() || null,
    }))
    .filter((item) => item.nome_completo);

  const cadastrarAlunosLote = async () => {
    if (itensLote.length === 0) return;

    setErroCadastroLote(null);
    setCadastrandoLote(true);
    try {
      const resposta = await apiRequest("/aluno/cadastrar_lote", {
        method: "POST",
        data: { turma_id: Number(id), alunos: itensLote },
      });
      setResultadoLote(resposta.alunos);
      // Já cai na mesma fila de impressão do cadastro individual — não
      // precisa que o professor marque aluno por aluno pra imprimir a turma inteira
      resposta.alunos.forEach((aluno) =>
        adicionarNaFilaImpressao(aluno.username, aluno.senha_temporaria),
      );
      recarregarAlunos();
    } catch (erro) {
      setErroCadastroLote(erro.message || "Não foi possível cadastrar os alunos.");
    } finally {
      setCadastrandoLote(false);
    }
  };

  const reiniciarCadastroLote = () => {
    setLinhasCadastro([linhaVazia()]);
    setResultadoLote(null);
    setErroCadastroLote(null);
  };

  // Matricular aluno já existente (de outra turma do mesmo professor) — busca
  // por nome ou matrícula, com um pequeno debounce pra não bater na API a
  // cada tecla
  const [buscaAlunoExistente, setBuscaAlunoExistente] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscandoAlunoExistente, setBuscandoAlunoExistente] = useState(false);
  const [matriculandoAlunoId, setMatriculandoAlunoId] = useState(null);
  const [erroMatricularExistente, setErroMatricularExistente] = useState(null);

  useEffect(() => {
    const termo = buscaAlunoExistente.trim();
    if (termo.length < 2) {
      setResultadosBusca([]);
      return;
    }

    const controller = new AbortController();
    const espera = setTimeout(() => {
      setBuscandoAlunoExistente(true);
      apiRequest(`/aluno/professor/meus?busca=${encodeURIComponent(termo)}`, {
        signal: controller.signal,
      })
        .then(setResultadosBusca)
        .catch((erro) => {
          if (erro.name !== "AbortError") setResultadosBusca([]);
        })
        .finally(() => setBuscandoAlunoExistente(false));
    }, 300);

    return () => {
      clearTimeout(espera);
      controller.abort();
    };
  }, [buscaAlunoExistente]);

  const matricularAlunoExistente = async (alunoId) => {
    setMatriculandoAlunoId(alunoId);
    setErroMatricularExistente(null);
    try {
      await apiRequest("/aluno_turma/criar", {
        method: "POST",
        data: { turma_id: Number(id), aluno_id: alunoId },
      });
      // Marca como matriculado na própria lista de resultados, em vez de
      // sumir com o card — assim o professor vê a confirmação sem perder o
      // contexto da busca, caso queira matricular outro homônimo em seguida
      setResultadosBusca((atual) =>
        atual.map((aluno) =>
          aluno.id === alunoId ? { ...aluno, jaMatriculado: true } : aluno,
        ),
      );
      recarregarAlunos();
    } catch (erro) {
      setErroMatricularExistente(erro.message || "Não foi possível matricular esse aluno.");
    } finally {
      setMatriculandoAlunoId(null);
    }
  };

  // Remover aluno = desmatricular da turma (aluno_turma), não apaga a conta dele.
  // A confirmação é um modal nosso (não window.confirm) pra caber a explicação
  // de que a conta do aluno continua existindo — o confirm nativo não deixa
  const [removendoMatriculaId, setRemovendoMatriculaId] = useState(null);
  const [alunoParaRemover, setAlunoParaRemover] = useState(null);
  const [erroAcaoAluno, setErroAcaoAluno] = useState(null);

  const pedirRemocaoAluno = (aluno) =>
    setAlunoParaRemover({
      matricula_id: aluno.matricula_id,
      nome: aluno.nome_completo || aluno.apelido,
    });

  const cancelarRemocaoAluno = () => setAlunoParaRemover(null);

  const confirmarRemocaoAluno = async () => {
    if (!alunoParaRemover) return;

    setRemovendoMatriculaId(alunoParaRemover.matricula_id);
    try {
      await apiRequest(`/aluno_turma/${alunoParaRemover.matricula_id}`, {
        method: "DELETE",
      });
      setAlunoParaRemover(null);
      recarregarAlunos();
    } catch (erro) {
      setAlunoParaRemover(null);
      setErroAcaoAluno(erro.message || "Não foi possível remover o aluno da turma.");
    } finally {
      setRemovendoMatriculaId(null);
    }
  };

  // Gerar nova senha temporária de um aluno já cadastrado ("olhinho" na lista)
  // — não dá pra reaver a senha antiga (fica só o hash), então isso sempre
  // gera uma nova e invalida a anterior
  const [resetandoSenhaAlunoId, setResetandoSenhaAlunoId] = useState(null);
  const [senhaResetada, setSenhaResetada] = useState(null); // {username, senha_temporaria}

  const resetarSenhaAluno = async (alunoId) => {
    setResetandoSenhaAlunoId(alunoId);
    try {
      const resposta = await apiRequest(`/aluno/${alunoId}/resetar_senha`, {
        method: "PATCH",
      });
      setSenhaResetada({
        username: resposta.username,
        senha_temporaria: resposta.senha_temporaria,
      });
    } catch (erro) {
      setErroAcaoAluno(erro.message || "Não foi possível gerar uma nova senha.");
    } finally {
      setResetandoSenhaAlunoId(null);
    }
  };

  const fecharSenhaResetada = () => setSenhaResetada(null);
  const fecharErroAcaoAluno = () => setErroAcaoAluno(null);

  // Exclusão da turma. O banco cuida das dependências sozinho e de formas
  // diferentes: `aluno_turma` é CASCADE (as matrículas somem, os alunos não),
  // `atividade` e `sessao_jogo` são SET NULL (sobrevivem, só perdem o vínculo).
  // Por isso a confirmação na tela pode dizer exatamente o que se perde.
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const abrirExclusao = () => setModalExclusaoAberto(true);
  const fecharExclusao = () => setModalExclusaoAberto(false);

  const excluirTurma = async () => {
    setExcluindo(true);
    setErro(null);
    try {
      await apiRequest(`/turma/${id}`, { method: "DELETE" });
      navigate("/professor/turmas");
    } catch (err) {
      setModalExclusaoAberto(false);
      setErro(err.message || "Não foi possível excluir a turma");
    } finally {
      setExcluindo(false);
    }
  };

  // Fila de impressão de credenciais — só existe no navegador (sessionStorage),
  // nunca no banco. É a única forma de "guardar" a senha em texto puro, já que
  // depois de gerada ela só existe como hash. Sobrevive a um F5 na mesma aba,
  // mas some ao fechar — suficiente pro caso de uso (cadastrar a turma toda numa
  // sentada e imprimir no fim).
  const chaveFilaImpressao = `fila_impressao_turma_${id}`;

  const [filaImpressao, setFilaImpressao] = useState(() => {
    if (!modoEdicao) return [];
    try {
      return JSON.parse(sessionStorage.getItem(chaveFilaImpressao)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!modoEdicao) return;
    sessionStorage.setItem(chaveFilaImpressao, JSON.stringify(filaImpressao));
  }, [filaImpressao, chaveFilaImpressao, modoEdicao]);

  const adicionarNaFilaImpressao = (username, senha_temporaria) => {
    setFilaImpressao((atual) => [...atual, { username, senha_temporaria }]);
  };

  const limparFilaImpressao = () => setFilaImpressao([]);

  return {
    id,
    modoEdicao,
    formData,
    codigoAcesso,
    alunos,
    atividades,
    rankingAlunos,
    totalAtividadesPublicadas,
    handleChange,
    handleSubmit,
    carregando,
    salvando,
    erro,
    modalAlunoAberto,
    abrirModalAluno,
    fecharModalAluno,
    abaModalAluno,
    setAbaModalAluno,
    linhasCadastro,
    alterarLinhaCadastro,
    adicionarLinhaCadastro,
    removerLinhaCadastro,
    itensLote,
    cadastrandoLote,
    erroCadastroLote,
    resultadoLote,
    cadastrarAlunosLote,
    reiniciarCadastroLote,
    buscaAlunoExistente,
    setBuscaAlunoExistente,
    resultadosBusca,
    buscandoAlunoExistente,
    matriculandoAlunoId,
    erroMatricularExistente,
    matricularAlunoExistente,
    removendoMatriculaId,
    alunoParaRemover,
    pedirRemocaoAluno,
    cancelarRemocaoAluno,
    confirmarRemocaoAluno,
    resetandoSenhaAlunoId,
    senhaResetada,
    resetarSenhaAluno,
    fecharSenhaResetada,
    erroAcaoAluno,
    fecharErroAcaoAluno,
    filaImpressao,
    adicionarNaFilaImpressao,
    limparFilaImpressao,
    houveAlteracao,
    desfazerAlteracoes,
    modalExclusaoAberto,
    abrirExclusao,
    fecharExclusao,
    excluirTurma,
    excluindo,
  };
}
